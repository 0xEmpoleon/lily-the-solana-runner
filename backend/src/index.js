const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8052;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/jupitar';

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// ── Leaderboard Schema ──────────────────────────────────────────────────────
const scoreSchema = new mongoose.Schema({
  name:      { type: String, default: 'Anonymous', maxlength: 24, trim: true },
  score:     { type: Number, required: true, min: 0 },
  coins:     { type: Number, default: 0, min: 0 },
  wallet:    { type: String, default: '', maxlength: 64, trim: true },
  createdAt: { type: Date, default: Date.now },
});

scoreSchema.index({ score: -1 });
const Score = mongoose.model('Score', scoreSchema);

// ── Routes ──────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mars Backend is running', timestamp: new Date() });
});

// Submit a score
app.post('/api/scores', async (req, res) => {
  try {
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
});

// Get top-20 leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const entries = await Score
      .find({}, 'name score coins wallet createdAt')
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
