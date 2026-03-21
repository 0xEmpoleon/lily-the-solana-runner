const mongoose = require('mongoose');
const { verifyMessage } = require('viem');

const MONGODB_URI = process.env.MONGODB_URI || '';
const ALLOWED_ORIGINS = [
  'https://lily-the-solana-runner.vercel.app',
  'https://lily-surfing-on-solana.vercel.app',
];
if (process.env.NODE_ENV !== 'production') ALLOWED_ORIGINS.push('http://localhost:5173', 'http://localhost:3000');

const MAX_SCORE = 100000;
const MAX_COINS = 10000;
const MAX_POINTS_PER_SECOND = 150;

let cached = global._mongooseConn;

async function connectDB() {
  if (cached && mongoose.connection.readyState === 1) return;
  cached = await mongoose.connect(MONGODB_URI);
  global._mongooseConn = cached;
}

// ── Score model ─────────────────────────────────────────────────────────────
const scoreSchema = new mongoose.Schema({
  name:      { type: String, default: 'Anonymous', maxlength: 24, trim: true },
  score:     { type: Number, required: true, min: 0, max: MAX_SCORE },
  coins:     { type: Number, default: 0, min: 0, max: MAX_COINS },
  wallet:    { type: String, default: '', maxlength: 64, trim: true },
  verified:  { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
scoreSchema.index({ score: -1 });
const Score = mongoose.models.Score || mongoose.model('Score', scoreSchema);

// ── Session model ───────────────────────────────────────────────────────────
const sessionSchema = new mongoose.Schema({
  token:     { type: String, required: true, unique: true, index: true },
  createdAt: { type: Date, default: Date.now, expires: 1800 },
  used:      { type: Boolean, default: false },
});
const GameSession = mongoose.models.GameSession || mongoose.model('GameSession', sessionSchema);

function getCorsOrigin(req) {
  const origin = req.headers.origin || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

function buildSignMessage(score, coins, sessionToken) {
  return `Lily Runner Score Submission\nScore: ${score}\nCoins: ${coins}\nSession: ${sessionToken}`;
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
    const { name, score, coins, wallet, sessionToken, signature } = req.body || {};

    // ── Validate types ──────────────────────────────────────────────────
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

    // ── Validate session token ──────────────────────────────────────────
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

    // ── Time plausibility check ─────────────────────────────────────────
    const elapsedMs = Date.now() - new Date(session.createdAt).getTime();
    const minTimeMs = Math.max(3000, (score / MAX_POINTS_PER_SECOND) * 1000);
    if (elapsedMs < minTimeMs) {
      return res.status(400).json({ error: 'Score not plausible for session duration' });
    }

    // ── Wallet signature verification ───────────────────────────────────
    let verified = false;
    if (wallet && signature) {
      try {
        const message = buildSignMessage(Math.floor(score), Math.floor(Number(coins) || 0), sessionToken);
        const valid = await verifyMessage({
          address: wallet,
          message,
          signature,
        });
        if (!valid) {
          return res.status(400).json({ error: 'Invalid wallet signature' });
        }
        verified = true;
      } catch {
        return res.status(400).json({ error: 'Signature verification failed' });
      }
    } else if (wallet && !signature) {
      // Wallet provided without signature — reject
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
};
