const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || '';

let cached = global._mongooseConn;

async function connectDB() {
  if (cached && mongoose.connection.readyState === 1) return;
  cached = await mongoose.connect(MONGODB_URI);
  global._mongooseConn = cached;
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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!MONGODB_URI) return res.status(503).json({ error: 'Database not configured' });

  try {
    await connectDB();
    const { name, score, coins, wallet } = req.body;
    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ error: 'Invalid score' });
    }
    const entry = await Score.create({
      name:   (name  || 'Anonymous').slice(0, 24),
      score:  Math.floor(score),
      coins:  Math.floor(coins || 0),
      wallet: (wallet || '').slice(0, 64),
    });
    res.status(201).json({ id: entry._id, message: 'Score saved' });
  } catch (err) {
    console.error('POST /api/scores error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
