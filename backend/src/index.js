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

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mars Backend is running', timestamp: new Date() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
