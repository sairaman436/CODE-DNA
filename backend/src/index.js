const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const rateLimit = require('express-rate-limit');

// ─── Industrial Security: DDoS Protection ───
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: "Too many requests from this IP, please try again after 15 minutes" }
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
const usernameRouter = require('./routes/username');

app.use('/api/analyze', analyzeRouter);
app.use('/api/webhook', webhookRouter);
app.use('/api/profile', profileRouter);
app.use('/api/status', statusRouter);
app.use('/api/compare', compareRouter);
app.use('/api/match', matchRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/activity', activityRouter);
app.use('/api/auth/otp', otpRouter);
app.use('/api/username', usernameRouter);

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
