const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

/**
 * Middleware: Verify Admin Role
 */
const isAdmin = async (req, res, next) => {
  // In a real app, you'd get the user from the session/JWT
  // For now, we assume the user ID is passed in headers or session
  const userId = req.headers['x-user-id']; 
  
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user && user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
};

/**
 * GET /api/admin/users
 * List all users with deep data
 */
router.get('/users', isAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        analysis_jobs: true,
        fingerprints: true,
        activity_logs: {
          orderBy: { created_at: 'desc' },
          take: 5
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/admin/logs
 * List all activity logs
 */
router.get('/logs', isAdmin, async (req, res) => {
  try {
    const logs = await prisma.activityLog.findMany({
      include: { user: true },
      orderBy: { created_at: 'desc' },
      take: 100
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Edit any user's profile
 */
router.patch('/users/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });

    // Log the admin action
    await prisma.activityLog.create({
      data: {
        user_id: req.headers['x-user-id'],
        action: 'ADMIN_EDIT_USER',
        details: `Edited user ${id}: ${JSON.stringify(updateData)}`
      }
    });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Moderation: delete user
 */
router.delete('/users/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
