const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8052;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/jupitar';

const MAX_SCORE = 100000;
const MAX_COINS = 10000;

// ── CORS — restrict to known origins ────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://lily-the-solana-runner.vercel.app',
  'https://lily-surfing-on-solana.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json({ limit: '16kb' }));

// ── Simple in-memory rate limiter ───────────────────────────────────────────
const RATE_WINDOW = 60 * 1000;
const RATE_MAX = 10;
const ipHits = new Map();

function rateLimit(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.ip;
  const now = Date.now();
  const record = ipHits.get(ip);
  if (!record || now - record.start > RATE_WINDOW) {
    ipHits.set(ip, { start: now, count: 1 });
    return next();
  }
  record.count++;
  if (record.count > RATE_MAX) {
    return res.status(429).json({ error: 'Too many requests. Try again later.' });
  }
  next();
}

// MongoDB Connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// ── Leaderboard Schema ──────────────────────────────────────────────────────
const scoreSchema = new mongoose.Schema({
  name:      { type: String, default: 'Anonymous', maxlength: 24, trim: true },
  score:     { type: Number, required: true, min: 0, max: MAX_SCORE },
  coins:     { type: Number, default: 0, min: 0, max: MAX_COINS },
  wallet:    { type: String, default: '', maxlength: 64, trim: true },
  createdAt: { type: Date, default: Date.now },
});

scoreSchema.index({ score: -1 });
const Score = mongoose.model('Score', scoreSchema);

// ── Routes ──────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Lily Backend is running', timestamp: new Date() });
});

// Submit a score
app.post('/api/scores', rateLimit, async (req, res) => {
  try {
    const { name, score, coins, wallet } = req.body;

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
});

// Get top-20 leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
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
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
