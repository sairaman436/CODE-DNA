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

const LANGUAGE_COLORS = {
  typescript: '#3178c6',
  ts: '#3178c6',
  javascript: '#f1e05a',
  js: '#f1e05a',
  python: '#3776ab',
  py: '#3776ab',
  rust: '#dea584',
  rs: '#dea584',
  go: '#00add8',
  golang: '#00add8',
  cpp: '#f34b7d',
  'c++': '#f34b7d',
  c: '#555555',
  java: '#b07219',
  html: '#e34c26',
  css: '#563d7c',
  ruby: '#701516',
  rb: '#701516',
  php: '#4f5d95',
  swift: '#f05138',
  kotlin: '#a97bff',
  kt: '#a97bff',
  shell: '#89e051',
  sh: '#89e051',
};

function getLanguageColor(lang) {
  const l = (lang || '').toLowerCase().trim();
  return LANGUAGE_COLORS[l] || '#8b5cf6'; // default purple
}

function getLanguageAbbrev(lang) {
  const l = (lang || '').toLowerCase().trim();
  if (l === 'typescript') return 'TS';
  if (l === 'javascript') return 'JS';
  if (l === 'python') return 'PY';
  if (l === 'rust') return 'RS';
  if (l === 'golang') return 'GO';
  if (l === 'shell') return 'SH';
  return lang.substring(0, 3).toUpperCase();
}

function formatLanguages(stats) {
  if (!stats || stats.length === 0) {
    return [{ name: 'JS', color: '#f1e05a', value: 100 }];
  }

  const totalLines = stats.reduce((acc, s) => acc + (s.total_lines || 0), 0);
  if (totalLines === 0) {
    return stats.map(s => ({
      name: getLanguageAbbrev(s.language),
      color: getLanguageColor(s.language),
      value: Math.round(100 / stats.length)
    }));
  }

  const mapped = stats.map(s => ({
    name: getLanguageAbbrev(s.language),
    color: getLanguageColor(s.language),
    value: Math.round(((s.total_lines || 0) / totalLines) * 100)
  }));

  mapped.sort((a, b) => b.value - a.value);
  return mapped.slice(0, 3);
}

// GET /api/leaderboard — Overall leaderboard (averaged scores)
router.get('/', async (req, res) => {
  try {
    const fingerprints = await prisma.fingerprint.findMany({
      orderBy: { created_at: 'desc' },
      take: 200,
      include: {
        user: {
          select: { username: true, codedna_username: true, display_name: true, avatar_url: true }
        },
        language_stats: true
      }
    });

    const seen = new Set();
    const leaderboard = [];
    for (const fp of fingerprints) {
      if (!fp.user || seen.has(fp.user_id)) continue;
      seen.add(fp.user_id);
      const overall = Math.round(
        ((fp.readability_score || 0) + (fp.complexity_score || 0) + (fp.documentation_score || 0) +
         (fp.test_mindset_score || 0) + (fp.commit_discipline_score || 0) + (fp.language_depth_score || 0) +
         (fp.refactor_tendency_score || 0) + (fp.error_handling_score || 0)) / 8
      );
      leaderboard.push({
        username: fp.user.codedna_username || fp.user.username,
        github_username: fp.user.username,
        codedna_username: fp.user.codedna_username,
        display_name: fp.user.display_name,
        avatar_url: fp.user.avatar_url,
        developer_type: fp.developer_type,
        readability_score: fp.readability_score || 0,
        complexity_score: fp.complexity_score || 0,
        documentation_score: fp.documentation_score || 0,
        test_mindset_score: fp.test_mindset_score || 0,
        error_handling_score: fp.error_handling_score || 0,
        language_depth_score: fp.language_depth_score || 0,
        commit_discipline_score: fp.commit_discipline_score || 0,
        refactor_tendency_score: fp.refactor_tendency_score || 0,
        overall_score: overall,
        languages: formatLanguages(fp.language_stats)
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
