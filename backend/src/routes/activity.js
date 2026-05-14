const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

// GET /api/activity — get recent analysis activity for the live feed
router.get('/', async (req, res) => {
  try {
    const recentFingerprints = await prisma.fingerprint.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            username: true,
            display_name: true
          }
        }
      }
    });

    const activity = recentFingerprints.map(fp => {
      const timeDiff = Math.floor((new Date().getTime() - new Date(fp.created_at).getTime()) / 60000);
      let timeStr = 'Just now';
      if (timeDiff > 0 && timeDiff < 60) timeStr = `${timeDiff}m ago`;
      else if (timeDiff >= 60) timeStr = `${Math.floor(timeDiff / 60)}h ago`;

      return {
        user: fp.user?.display_name || fp.user?.username || 'Developer',
        action: 'achieved',
        result: fp.developer_type || 'Analysis Complete',
        time: timeStr
      };
    });

    return res.json(activity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
