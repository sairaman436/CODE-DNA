const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Global limit
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "System limit reached. Please try again later." }
});

// Stricter limit for talent discovery to prevent mass-scraping
const discoveryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit to 50 profile views/searches per hour
  message: { error: "Discovery limit reached. Slow down your analysis." }
});

// Middleware
app.use(limiter); // Apply rate limiting to all requests
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Routes
const analyzeRouter = require('./routes/analyze');
const webhookRouter = require('./routes/webhook');
const profileRouter = require('./routes/profile');
const statusRouter = require('./routes/status');
const compareRouter = require('./routes/compare');
const matchRouter = require('./routes/match');
const settingsRouter = require('./routes/settings');
const leaderboardRouter = require('./routes/leaderboard');
const activityRouter = require('./routes/activity');
const otpRouter = require('./routes/otp');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const usernameRouter = require('./routes/username');

app.use('/api/analyze', analyzeRouter);
app.use('/api/webhook', webhookRouter);
app.use('/api/profile', discoveryLimiter, profileRouter);
app.use('/api/status', statusRouter);
app.use('/api/compare', compareRouter);
app.use('/api/match', matchRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/leaderboard', discoveryLimiter, leaderboardRouter);
app.use('/api/activity', activityRouter);
app.use('/api/auth/otp', otpRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/username', discoveryLimiter, usernameRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'codedna-backend', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`✅ CodeDNA Backend running on http://localhost:${PORT}`);
  console.log(`   Routes: /api/analyze, /api/profile, /api/status, /api/compare, /api/match, /api/settings, /api/webhook`);
});
