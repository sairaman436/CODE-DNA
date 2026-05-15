const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

// Valid axes for leaderboard
const VALID_AXES = {
  readability: 'readability_score',
  complexity: 'complexity_score',
  documentation: 'documentation_score',
  test_mindset: 'test_mindset_score',
  commit_discipline: 'commit_discipline_score',
  language_depth: 'language_depth_score',
  refactor_tendency: 'refactor_tendency_score',
  error_handling: 'error_handling_score',
};

// GET /api/leaderboard — Overall leaderboard (averaged scores)
router.get('/', async (req, res) => {
  try {
    const fingerprints = await prisma.fingerprint.findMany({
      orderBy: { created_at: 'desc' },
      take: 200,
      include: {
        user: {
          select: { username: true, codedna_username: true, display_name: true, avatar_url: true }
        }
      }
    });

    const seen = new Set();
    const leaderboard = [];
    for (const fp of fingerprints) {
      if (!fp.user || seen.has(fp.user.username)) continue;
      seen.add(fp.user.username);
      const overall = Math.round(
        ((fp.readability_score || 0) + (fp.complexity_score || 0) + (fp.documentation_score || 0) +
         (fp.test_mindset_score || 0) + (fp.commit_discipline_score || 0) + (fp.language_depth_score || 0) +
         (fp.refactor_tendency_score || 0) + (fp.error_handling_score || 0)) / 8
      );
      leaderboard.push({
        username: fp.user.codedna_username || fp.user.username,
        github_username: fp.user.username,
        display_name: fp.user.display_name,
        avatar_url: fp.user.avatar_url,
        developer_type: fp.developer_type,
        readability_score: fp.readability_score || 0,
        complexity_score: fp.complexity_score || 0,
        overall_score: overall,
      });
    }

    leaderboard.sort((a, b) => b.overall_score - a.overall_score);

    return res.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/leaderboard/:axis — Top developers for a specific axis
router.get('/:axis', async (req, res) => {
  try {
    const { axis } = req.params;
    const dbField = VALID_AXES[axis];

    if (!dbField) {
      return res.status(400).json({ error: `Invalid axis. Valid: ${Object.keys(VALID_AXES).join(', ')}` });
    }

    // Get latest fingerprint per user, sorted by the axis score
    const fingerprints = await prisma.fingerprint.findMany({
      where: { [dbField]: { not: null } },
      orderBy: { [dbField]: 'desc' },
      take: 100,
      include: {
        user: {
          select: { username: true, codedna_username: true, display_name: true, avatar_url: true }
        }
      }
    });

    // Deduplicate by user (take highest score per user)
    const seen = new Set();
    const leaderboard = [];
    for (const fp of fingerprints) {
      if (!fp.user || seen.has(fp.user.username)) continue;
      seen.add(fp.user.username);
      leaderboard.push({
        rank: leaderboard.length + 1,
        username: fp.user.codedna_username || fp.user.username,
        github_username: fp.user.username,
        display_name: fp.user.display_name,
        avatar_url: fp.user.avatar_url,
        score: fp[dbField],
        developer_type: fp.developer_type,
      });
    }

    return res.json({ axis, leaderboard });

  } catch (error) {
    console.error('Leaderboard error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
