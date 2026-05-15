const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

// Username validation regex: 3-20 chars, alphanumeric + underscores, must start with letter
const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;

// Reserved usernames that cannot be claimed
const RESERVED = [
  'admin', 'api', 'login', 'signup', 'settings', 'profile', 'discover',
  'leaderboard', 'compare', 'match', 'team', 'pricing', 'support',
  'help', 'about', 'codedna', 'code_dna', 'null', 'undefined',
];

// GET /api/username/check?q=desired_name — Check availability
router.get('/check', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.json({ available: false, reason: 'Username is required' });
    }

    const name = q.trim().toLowerCase();

    if (!USERNAME_REGEX.test(name)) {
      return res.json({
        available: false,
        reason: 'Must be 3-20 characters, start with a letter, and contain only letters, numbers, or underscores.'
      });
    }

    if (RESERVED.includes(name)) {
      return res.json({ available: false, reason: 'This username is reserved.' });
    }

    const existing = await prisma.user.findFirst({
      where: { codedna_username: name }
    });

    if (existing) {
      return res.json({ available: false, reason: 'This username is already taken.' });
    }

    return res.json({ available: true, username: name });

  } catch (error) {
    console.error('Username check error:', error);
    return res.status(500).json({ available: false, reason: 'Server error' });
  }
});

// POST /api/username/claim — Claim or change username
router.post('/claim', async (req, res) => {
  try {
    const { user_id, github_id, username } = req.body;

    if (!username || !USERNAME_REGEX.test(username.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid username format.' });
    }

    const name = username.toLowerCase();

    if (RESERVED.includes(name)) {
      return res.status(400).json({ error: 'This username is reserved.' });
    }

    // Find user
    let user;
    if (user_id) {
      user = await prisma.user.findUnique({ where: { id: user_id } });
    } else if (github_id) {
      user = await prisma.user.findUnique({ where: { github_id: String(github_id) } });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check if user already has a username and if 30-day cooldown applies
    if (user.codedna_username) {
      const changedAt = user.username_changed_at;
      if (changedAt) {
        const daysSinceChange = (Date.now() - new Date(changedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceChange < 30) {
          const daysLeft = Math.ceil(30 - daysSinceChange);
          return res.status(429).json({
            error: `Username can only be changed once every 30 days. Try again in ${daysLeft} day(s).`
          });
        }
      }
    }

    // Check availability
    const existing = await prisma.user.findFirst({
      where: { codedna_username: name, NOT: { id: user.id } }
    });
    if (existing) {
      return res.status(409).json({ error: 'Username is already taken.' });
    }

    // Claim the username
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        codedna_username: name,
        username_changed_at: new Date(),
      }
    });

    return res.json({
      success: true,
      codedna_username: updated.codedna_username,
      message: user.codedna_username ? 'Username changed successfully.' : 'Username claimed successfully!',
    });

  } catch (error) {
    console.error('Username claim error:', error);
    return res.status(500).json({ error: 'Failed to claim username.' });
  }
});

module.exports = router;
