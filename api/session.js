const mongoose = require('mongoose');
const crypto = require('crypto');

const MONGODB_URI = process.env.MONGODB_URI || '';
const ALLOWED_ORIGINS = [
  'https://lily-the-solana-runner.vercel.app',
  'https://lily-surfing-on-solana.vercel.app',
];
if (process.env.NODE_ENV !== 'production') ALLOWED_ORIGINS.push('http://localhost:5173', 'http://localhost:3000');

let cached = global._mongooseConn;

async function connectDB() {
  if (cached && mongoose.connection.readyState === 1) return;
  cached = await mongoose.connect(MONGODB_URI);
  global._mongooseConn = cached;
}

const sessionSchema = new mongoose.Schema({
  token:     { type: String, required: true, unique: true, index: true },
  createdAt: { type: Date, default: Date.now, expires: 1800 }, // TTL: 30 min
  used:      { type: Boolean, default: false },
});

const GameSession = mongoose.models.GameSession || mongoose.model('GameSession', sessionSchema);

function getCorsOrigin(req) {
  const origin = req.headers.origin || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

module.exports = async function handler(req, res) {
  const corsOrigin = getCorsOrigin(req);
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!MONGODB_URI) return res.status(503).json({ error: 'Database not configured' });

  try {
    await connectDB();
    const token = crypto.randomUUID();
    await GameSession.create({ token });
    res.status(201).json({ token });
  } catch (err) {
    console.error('POST /api/session error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
