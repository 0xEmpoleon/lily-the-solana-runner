const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || '';
const ALLOWED_ORIGINS = [
  'https://lily-the-solana-runner.vercel.app',
  'https://lily-surfing-on-solana.vercel.app',
];
if (process.env.NODE_ENV !== 'production') ALLOWED_ORIGINS.push('http://localhost:5173', 'http://localhost:3000');

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGODB_URI);
}

const scoreSchema = new mongoose.Schema({
  name:      { type: String, default: 'Anonymous', maxlength: 24, trim: true },
  score:     { type: Number, required: true, min: 0 },
  coins:     { type: Number, default: 0, min: 0 },
  wallet:    { type: String, default: '', maxlength: 64, trim: true },
  createdAt: { type: Date, default: Date.now },
});
scoreSchema.index({ score: -1 });

const Score = mongoose.models.Score || mongoose.model('Score', scoreSchema);

function getCorsOrigin(req) {
  const origin = req.headers.origin || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

module.exports = async function handler(req, res) {
  const corsOrigin = getCorsOrigin(req);
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (!MONGODB_URI) return res.status(503).json({ error: 'Database not configured' });

  try {
    await connectDB();
    const entries = await Score
      .find({}, 'name score coins createdAt')
      .sort({ score: -1 })
      .limit(20)
      .lean();
    res.json(entries);
  } catch (err) {
    console.error('GET /api/leaderboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
