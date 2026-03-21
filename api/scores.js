const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || '';
const ALLOWED_ORIGINS = [
  'https://lily-the-solana-runner.vercel.app',
  'https://lily-surfing-on-solana.vercel.app',
];
if (process.env.NODE_ENV !== 'production') ALLOWED_ORIGINS.push('http://localhost:5173', 'http://localhost:3000');

const MAX_SCORE = 100000;
const MAX_COINS = 10000;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5;            // 5 submissions per minute per IP
const ipHits = new Map();

let cached = global._mongooseConn;

async function connectDB() {
  if (cached && mongoose.connection.readyState === 1) return;
  cached = await mongoose.connect(MONGODB_URI);
  global._mongooseConn = cached;
}

const scoreSchema = new mongoose.Schema({
  name:      { type: String, default: 'Anonymous', maxlength: 24, trim: true },
  score:     { type: Number, required: true, min: 0, max: MAX_SCORE },
  coins:     { type: Number, default: 0, min: 0, max: MAX_COINS },
  wallet:    { type: String, default: '', maxlength: 64, trim: true },
  createdAt: { type: Date, default: Date.now },
});
scoreSchema.index({ score: -1 });

const Score = mongoose.models.Score || mongoose.model('Score', scoreSchema);

function getCorsOrigin(req) {
  const origin = req.headers.origin || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

function checkRateLimit(ip) {
  const now = Date.now();
  const record = ipHits.get(ip);
  if (!record || now - record.start > RATE_LIMIT_WINDOW) {
    ipHits.set(ip, { start: now, count: 1 });
    return true;
  }
  record.count++;
  return record.count <= RATE_LIMIT_MAX;
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

  // Rate limiting
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Try again later.' });
  }

  try {
    await connectDB();
    const { name, score, coins, wallet } = req.body || {};

    // Validate types
    if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > MAX_SCORE) {
      return res.status(400).json({ error: 'Invalid score' });
    }
    if (coins !== undefined && (typeof coins !== 'number' || !Number.isFinite(coins) || coins < 0 || coins > MAX_COINS)) {
      return res.status(400).json({ error: 'Invalid coins' });
    }
    if (name !== undefined && typeof name !== 'string') {
      return res.status(400).json({ error: 'Invalid name' });
    }
    if (wallet !== undefined && typeof wallet !== 'string') {
      return res.status(400).json({ error: 'Invalid wallet' });
    }

    const entry = await Score.create({
      name:   String(name || 'Anonymous').slice(0, 24),
      score:  Math.floor(score),
      coins:  Math.floor(Number(coins) || 0),
      wallet: String(wallet || '').slice(0, 64),
    });
    res.status(201).json({ id: entry._id, message: 'Score saved' });
  } catch (err) {
    console.error('POST /api/scores error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
