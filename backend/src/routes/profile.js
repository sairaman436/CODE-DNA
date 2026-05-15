const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

// GET /api/profile/:username — full profile data (public, LinkedIn-style)
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // Try codedna_username first, then fall back to GitHub username
    let user = await prisma.user.findFirst({
      where: { codedna_username: username },
      include: {
        fingerprints: {
          orderBy: { created_at: 'desc' },
          take: 1,
          include: {
            language_stats: true,
            commit_patterns: true
          }
        }
      }
    });

    if (!user) {
      user = await prisma.user.findFirst({
        where: { username },
        include: {
          fingerprints: {
            orderBy: { created_at: 'desc' },
            take: 1,
            include: {
              language_stats: true,
              commit_patterns: true
            }
          }
        }
      });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.fingerprints.length === 0) {
      return res.status(404).json({ error: 'No analysis found. Run an analysis first.' });
    }

    const fp = user.fingerprints[0];

    const profileData = {
      user: {
        username: user.username,
        codedna_username: user.codedna_username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        last_analyzed_at: user.last_analyzed_at,
      },
      type: fp.developer_type,
      summary: fp.personality_summary,
      strengths: fp.strengths ? JSON.parse(fp.strengths) : [],
      growth_areas: fp.growth_areas ? JSON.parse(fp.growth_areas) : [],
      radar: [
        { axis: 'Readability', value: fp.readability_score || 0 },
        { axis: 'Complexity', value: fp.complexity_score || 0 },
        { axis: 'Documentation', value: fp.documentation_score || 0 },
        { axis: 'Test Mindset', value: fp.test_mindset_score || 0 },
        { axis: 'Commit Discipline', value: fp.commit_discipline_score || 0 },
        { axis: 'Language Depth', value: fp.language_depth_score || 0 },
        { axis: 'Refactor Tendency', value: fp.refactor_tendency_score || 0 },
        { axis: 'Error Handling', value: fp.error_handling_score || 0 },
      ],
      languages: fp.language_stats.map(ls => ({
        language: ls.language,
        total_lines: ls.total_lines,
        total_commits: ls.total_commits,
        trend: ls.trend,
      })),
      commit_patterns: fp.commit_patterns.length > 0 ? fp.commit_patterns[0] : null,
      repos_analyzed: fp.repos_analyzed || Math.max(fp.language_stats.length, 1),
      total_files_analyzed: fp.total_files_analyzed || 0,
      activity_pulse: fp.activity_pulse ? JSON.parse(fp.activity_pulse) : [],
      analyzed_at: fp.created_at,
    };

    return res.json(profileData);

  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
