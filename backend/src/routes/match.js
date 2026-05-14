const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

// GET /api/match/:username — Find complementary teammates
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const mode = req.query.mode || 'complementary'; // 'complementary' or 'similar'

    // Get the requesting user's vector
    const user = await prisma.user.findFirst({ where: { username } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const userVector = await prisma.developerVector.findFirst({
      where: { user_id: user.id },
      orderBy: { updated_at: 'desc' }
    });
    if (!userVector) return res.status(404).json({ error: 'No analysis found. Run an analysis first.' });

    const userEmbedding = JSON.parse(userVector.embedding);

    // Get all other user vectors
    const allVectors = await prisma.developerVector.findMany({
      where: { user_id: { not: user.id } },
      include: {
        user: {
          include: {
            fingerprints: { orderBy: { created_at: 'desc' }, take: 1 }
          }
        }
      }
    });

    // Calculate similarity/complementarity for each
    const matches = allVectors
      .filter(v => v.user && v.user.fingerprints.length > 0)
      .map(v => {
        const otherEmbedding = JSON.parse(v.embedding);
        const similarity = cosineSimilarity(userEmbedding, otherEmbedding);
        const fp = v.user.fingerprints[0];

        // Find what blind spots this person fills
        const axisNames = ['Readability', 'Complexity', 'Documentation', 'Test Mindset',
          'Commit Discipline', 'Language Depth', 'Refactor Tendency', 'Error Handling'];
        
        const fillsBlindSpots = [];
        const sharedStrengths = [];

        for (let i = 0; i < 8; i++) {
          if (userEmbedding[i] < 50 && otherEmbedding[i] >= 60) {
            fillsBlindSpots.push(axisNames[i]);
          }
          if (userEmbedding[i] >= 60 && otherEmbedding[i] >= 60) {
            sharedStrengths.push(axisNames[i]);
          }
        }

        const matchScore = mode === 'complementary'
          ? Math.round((1 - similarity) * 100) // Lower similarity = more complementary
          : Math.round(similarity * 100);       // Higher similarity = more similar

        return {
          username: v.user.username,
          name: v.user.display_name || v.user.username,
          avatar: v.user.avatar_url,
          type: fp.developer_type,
          matchScore,
          fillsBlindSpots: fillsBlindSpots.slice(0, 3),
          sharedStrengths: sharedStrengths.slice(0, 3),
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    return res.json({ matches, mode });

  } catch (error) {
    console.error('Match error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

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
