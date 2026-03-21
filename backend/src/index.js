const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const { verifyMessage } = require('viem');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8052;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/jupitar';

const MAX_SCORE = 100000;
const MAX_COINS = 10000;
const MAX_POINTS_PER_SECOND = 150;

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

// ── Schemas ─────────────────────────────────────────────────────────────────
const scoreSchema = new mongoose.Schema({
  name:      { type: String, default: 'Anonymous', maxlength: 24, trim: true },
  score:     { type: Number, required: true, min: 0, max: MAX_SCORE },
  coins:     { type: Number, default: 0, min: 0, max: MAX_COINS },
  wallet:    { type: String, default: '', maxlength: 64, trim: true },
  verified:  { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
scoreSchema.index({ score: -1 });
const Score = mongoose.model('Score', scoreSchema);

const sessionSchema = new mongoose.Schema({
  token:     { type: String, required: true, unique: true, index: true },
  createdAt: { type: Date, default: Date.now, expires: 1800 },
  used:      { type: Boolean, default: false },
});
const GameSession = mongoose.model('GameSession', sessionSchema);

function buildSignMessage(score, coins, sessionToken) {
  return `Lily Runner Score Submission\nScore: ${score}\nCoins: ${coins}\nSession: ${sessionToken}`;
}

// ── Routes ──────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Lily Backend is running', timestamp: new Date() });
});

// Create game session
app.post('/api/session', rateLimit, async (req, res) => {
  try {
    const token = crypto.randomUUID();
    await GameSession.create({ token });
    res.status(201).json({ token });
  } catch (err) {
    console.error('POST /api/session error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit a score
app.post('/api/scores', rateLimit, async (req, res) => {
  try {
    const { name, score, coins, wallet, sessionToken, signature } = req.body;

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

    // Validate session token
    if (!sessionToken || typeof sessionToken !== 'string') {
      return res.status(400).json({ error: 'Missing session token' });
    }

    const session = await GameSession.findOneAndUpdate(
      { token: sessionToken, used: false },
      { $set: { used: true } },
      { new: false }
    );

    if (!session) {
      return res.status(400).json({ error: 'Invalid or expired session' });
    }

    // Time plausibility check
    const elapsedMs = Date.now() - new Date(session.createdAt).getTime();
    const minTimeMs = Math.max(3000, (score / MAX_POINTS_PER_SECOND) * 1000);
    if (elapsedMs < minTimeMs) {
      return res.status(400).json({ error: 'Score not plausible for session duration' });
    }

    // Wallet signature verification
    let verified = false;
    if (wallet && signature) {
      try {
        const message = buildSignMessage(Math.floor(score), Math.floor(Number(coins) || 0), sessionToken);
        const valid = await verifyMessage({ address: wallet, message, signature });
        if (!valid) {
          return res.status(400).json({ error: 'Invalid wallet signature' });
        }
        verified = true;
      } catch {
        return res.status(400).json({ error: 'Signature verification failed' });
      }
    } else if (wallet && !signature) {
      return res.status(400).json({ error: 'Wallet submissions require a signature' });
    }

    const entry = await Score.create({
      name:     String(name || 'Anonymous').slice(0, 24),
      score:    Math.floor(score),
      coins:    Math.floor(Number(coins) || 0),
      wallet:   verified ? String(wallet).slice(0, 64) : '',
      verified,
    });
    res.status(201).json({ id: entry._id, message: 'Score saved', verified });
  } catch (err) {
    console.error('POST /api/scores error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get top-20 leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const entries = await Score
      .find({}, 'name score coins verified createdAt')
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
