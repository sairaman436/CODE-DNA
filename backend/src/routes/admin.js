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
  
  if (!userId) {
    console.log('[ADMIN_AUTH] Denied: Missing x-user-id header');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user && user.role === 'ADMIN') {
    next();
  } else {
    console.log(`[ADMIN_AUTH] Denied: User ${userId} is not an ADMIN. Found role: ${user?.role || 'NONE'}`);
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
    
    // Whitelist allowed fields to prevent injection of password, email_verified, etc.
    const { display_name, role, staff_type } = req.body;
    const updateData = {};
    if (display_name !== undefined) updateData.display_name = display_name;
    if (role && ['USER', 'ADMIN', 'STAFF'].includes(role)) updateData.role = role;
    if (staff_type !== undefined) updateData.staff_type = staff_type || null;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

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
    console.error('[ADMIN_PATCH] Error:', err);
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
    const { sendMail } = require('../lib/mailer');
    const targetUser = await prisma.user.findUnique({ where: { id } });
    
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent banning yourself
    if (id === req.headers['x-user-id']) {
      return res.status(400).json({ error: 'Cannot revoke your own identity.' });
    }

    // Log the ban action
    await prisma.activityLog.create({
      data: {
        user_id: req.headers['x-user-id'],
        action: 'ADMIN_BAN_USER',
        details: `Revoked identity for user ${id} (${targetUser.display_name || targetUser.email})`
      }
    });

    // Update user status to BANNED
    await prisma.user.update({
      where: { id },
      data: { status: 'BANNED' }
    });

    // Send Notification Email
    try {
      await sendMail({
        from: `"Code DNA Moderation" <${process.env.GMAIL_USER || 'noreply@codedna.dev'}>`,
        to: targetUser.email,
        subject: "Identity Revocation Notice — Code DNA",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #050505; color: #fff; border-radius: 24px; border: 1px solid #333;">
            <h1 style="color: #ef4444; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Access Revoked</h1>
            <p style="color: #ccc; font-size: 16px; line-height: 1.6;">
              We are writing to inform you that your technical identity has been removed from the <b>Code DNA Community</b>.
            </p>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              As a result, no further services are available to this account. We appreciate your past contributions.
            </p>
            <div style="margin-top: 40px; border-top: 1px solid #222; padding-top: 20px; font-size: 10px; color: #444; text-transform: uppercase; letter-spacing: 1px;">
              System Moderation Protocol — Level 05
            </div>
          </div>
        `
      });
    } catch (mailErr) {
      console.error('Failed to send ban email:', mailErr);
    }
    
    res.json({ success: true, message: 'User identity revoked and notified.' });
  } catch (err) {
    console.error('[ADMIN_DELETE] Error:', err);
    res.status(500).json({ error: 'Failed to revoke user identity' });
  }
});

/**
 * PATCH /api/admin/users/:id/restore
 * Moderation: unban user (RESTORE access with all data intact)
 */
router.patch('/users/:id/restore', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await prisma.user.findUnique({ where: { id } });
    
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Restore to ACTIVE status - Data remains intact
    await prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' }
    });

    // Log the restore action
    await prisma.activityLog.create({
      data: {
        user_id: req.headers['x-user-id'],
        action: 'ADMIN_RESTORE_USER',
        details: `Restored access for user ${id} (${targetUser.display_name || targetUser.email})`
      }
    });

    res.json({ success: true, message: 'User identity restored successfully.' });
  } catch (err) {
    console.error('[ADMIN_RESTORE] Error:', err);
    res.status(500).json({ error: 'Failed to restore user identity' });
  }
});

/**
 * DELETE /api/admin/users/:id/wipe
 * Moderation: permanently delete user and all data
 */
router.delete('/users/:id/wipe', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await prisma.user.findUnique({ where: { id } });
    
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hard Delete: Remove entire user record (Cascade will handle fingerprints, etc.)
    await prisma.user.delete({ where: { id } });

    // Log the wipe action
    await prisma.activityLog.create({
      data: {
        user_id: req.headers['x-user-id'],
        action: 'ADMIN_WIPE_USER',
        details: `Permanently wiped identity for user ${id}`
      }
    });

    res.json({ success: true, message: 'User identity wiped from database.' });
  } catch (err) {
    console.error('[ADMIN_WIPE] Error:', err);
    res.status(500).json({ error: 'Failed to wipe user identity' });
  }
});

module.exports = router;
