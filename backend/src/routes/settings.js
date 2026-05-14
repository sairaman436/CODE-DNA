const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

// PUT /api/settings/privacy — Toggle profile visibility
router.put('/privacy', async (req, res) => {
  try {
    const { github_id, is_public } = req.body;
    if (!github_id) return res.status(400).json({ error: 'Missing github_id' });

    await prisma.user.update({
      where: { github_id: github_id.toString() },
      data: { plan: is_public ? 'public' : 'private' }
    });

    return res.json({ message: 'Privacy setting updated' });
  } catch (error) {
    console.error('Settings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/settings/reanalyze — Trigger fresh analysis
router.post('/reanalyze', async (req, res) => {
  try {
    const { username, github_id, display_name, avatar_url } = req.body;
    if (!username || !github_id) return res.status(400).json({ error: 'Missing required fields' });

    // Delete old fingerprints and vectors for a clean re-analysis
    const user = await prisma.user.findFirst({ where: { github_id: github_id.toString() } });
    if (user) {
      await prisma.fingerprint.deleteMany({ where: { user_id: user.id } });
      await prisma.developerVector.deleteMany({ where: { user_id: user.id } });
    }

    // Forward to the analyze route logic
    return res.json({ message: 'Old data cleared. Trigger a new analysis from the frontend.' });
  } catch (error) {
    console.error('Reanalyze error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/settings/account — Delete account and all data
router.delete('/account', async (req, res) => {
  try {
    const { github_id } = req.body;
    if (!github_id) return res.status(400).json({ error: 'Missing github_id' });

    const user = await prisma.user.findUnique({ where: { github_id: github_id.toString() } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Cascade delete handles fingerprints, vectors, jobs
    await prisma.user.delete({ where: { id: user.id } });

    return res.json({ message: 'Account and all data permanently deleted' });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
