const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

// GET /api/compare/:user1/:user2 — Compare two developer DNA profiles
router.get('/:user1/:user2', async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    // Fetch both profiles
    const [profile1, profile2] = await Promise.all([
      getLatestFingerprint(user1),
      getLatestFingerprint(user2),
    ]);

    if (!profile1) return res.status(404).json({ error: `No analysis found for ${user1}` });
    if (!profile2) return res.status(404).json({ error: `No analysis found for ${user2}` });

    // Build score vectors
    const axes = ['readability_score', 'complexity_score', 'documentation_score', 'test_mindset_score',
      'commit_discipline_score', 'language_depth_score', 'refactor_tendency_score', 'error_handling_score'];
    
    const vec1 = axes.map(a => profile1.fingerprint[a] || 0);
    const vec2 = axes.map(a => profile2.fingerprint[a] || 0);

    // Cosine similarity
    const compatibility = cosineSimilarity(vec1, vec2);

    // Determine who is stronger where
    const axisNames = ['Readability', 'Complexity', 'Documentation', 'Test Mindset',
      'Commit Discipline', 'Language Depth', 'Refactor Tendency', 'Error Handling'];

    const comparison = axisNames.map((name, i) => ({
      axis: name,
      user1_score: vec1[i],
      user2_score: vec2[i],
      stronger: vec1[i] > vec2[i] ? user1 : vec2[i] > vec1[i] ? user2 : 'tie',
    }));

    // Team fit label
    let teamFit;
    if (compatibility > 0.9) teamFit = 'Too similar — low diversity';
    else if (compatibility > 0.7) teamFit = 'Similar profiles';
    else if (compatibility > 0.4) teamFit = 'Complementary skills';
    else teamFit = 'Great collaborators — high diversity';

    return res.json({
      user1: { username: user1, type: profile1.fingerprint.developer_type, avatar_url: profile1.user.avatar_url },
      user2: { username: user2, type: profile2.fingerprint.developer_type, avatar_url: profile2.user.avatar_url },
      compatibility_score: Math.round(compatibility * 100),
      team_fit: teamFit,
      comparison,
      radar1: axisNames.map((name, i) => ({ axis: name, value: vec1[i] })),
      radar2: axisNames.map((name, i) => ({ axis: name, value: vec2[i] })),
    });

  } catch (error) {
    console.error('Compare error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

async function getLatestFingerprint(username) {
  const user = await prisma.user.findFirst({
    where: { username },
    include: {
      fingerprints: { orderBy: { created_at: 'desc' }, take: 1 }
    }
  });
  if (!user || user.fingerprints.length === 0) return null;
  return { user, fingerprint: user.fingerprints[0] };
}

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

module.exports = router;
