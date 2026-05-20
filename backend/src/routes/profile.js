const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

// GET /api/profile/status/:userId — lightweight status check
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true, id: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ status: user.status });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/profile/github/:githubId — lookup user by GitHub ID (for identity sync)
router.get('/github/:githubId', async (req, res) => {
  try {
    const { githubId } = req.params;
    const user = await prisma.user.findUnique({
      where: { github_id: githubId.toString() }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

    const fp = user.fingerprints.length > 0 ? user.fingerprints[0] : null;

    const profileData = {
      user: {
        id: user.id,
        username: user.username,
        codedna_username: user.codedna_username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        last_analyzed_at: user.last_analyzed_at,
        role: user.role,
        staff_type: user.staff_type,
        bio: user.bio,
        cover_url: user.cover_url,
        accent_theme: user.accent_theme,
        pinned_badges: user.pinned_badges,
      },
      type: fp ? fp.developer_type : 'Unanalyzed Developer',
      summary: fp ? fp.personality_summary : 'Technical DNA sequence not yet initialized.',
      strengths: fp && fp.strengths ? JSON.parse(fp.strengths) : [],
      growth_areas: fp && fp.growth_areas ? JSON.parse(fp.growth_areas) : [],
      radar: [
        { axis: 'Readability', value: fp?.readability_score || 0 },
        { axis: 'Complexity', value: fp?.complexity_score || 0 },
        { axis: 'Documentation', value: fp?.documentation_score || 0 },
        { axis: 'Test Mindset', value: fp?.test_mindset_score || 0 },
        { axis: 'Commit Discipline', value: fp?.commit_discipline_score || 0 },
        { axis: 'Language Depth', value: fp?.language_depth_score || 0 },
        { axis: 'Refactor Tendency', value: fp?.refactor_tendency_score || 0 },
        { axis: 'Error Handling', value: fp?.error_handling_score || 0 },
      ],
      languages: fp ? fp.language_stats.map(ls => ({
        language: ls.language,
        total_lines: ls.total_lines,
        total_commits: ls.total_commits,
        trend: ls.trend,
      })) : [],
      commit_patterns: fp && fp.commit_patterns.length > 0 ? fp.commit_patterns[0] : null,
      repos_analyzed: fp ? (fp.repos_analyzed || Math.max(fp.language_stats.length, 1)) : 0,
      total_files_analyzed: fp ? (fp.total_files_analyzed || 0) : 0,
      total_commits: fp ? fp.language_stats.reduce((sum, ls) => sum + (ls.total_commits || 0), 0) : 0,
      avg_commits_per_week: fp && fp.commit_patterns.length > 0
        ? Math.round((fp.language_stats.reduce((sum, ls) => sum + (ls.total_commits || 0), 0)) / Math.max(1, Math.ceil((Date.now() - new Date(fp.created_at || Date.now()).getTime()) / (7 * 24 * 60 * 60 * 1000))))
        : 0,
      top_patterns: fp && fp.strengths ? JSON.parse(fp.strengths).slice(0, 4) : [],
      coding_since: user.created_at ? new Date(user.created_at).getFullYear().toString() : 'Unknown',
      activity_pulse: fp && fp.activity_pulse ? JSON.parse(fp.activity_pulse) : [],
      analyzed_at: fp ? fp.created_at : null,
    };

    return res.json(profileData);

  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
