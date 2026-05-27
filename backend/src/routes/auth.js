const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const transporter = require('../lib/mailer');

const router = express.Router();

/**
 * POST /api/auth/register
 * Initial registration step: captures user data and sends OTP
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, countryCode } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing && existing.email_verified) {
      return res.status(400).json({ error: 'User already exists' });
    }

    let gitUsername = null;
    let gitId = null;
    let gitAvatar = null;

    // Verify email is registered on GitHub
    try {
      const searchUrl = `https://api.github.com/search/users?q=${encodeURIComponent(email)}+in:email`;
      const headers = { 'User-Agent': 'Code-DNA-App' };
      if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
        const credentials = Buffer.from(`${process.env.GITHUB_CLIENT_ID}:${process.env.GITHUB_CLIENT_SECRET}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
      }
      const gitCheck = await fetch(searchUrl, { headers });
      if (gitCheck.ok) {
        const gitData = await gitCheck.json();
        if (gitData.total_count === 0) {
          return res.status(400).json({ error: 'This email is not associated with any GitHub account. You must register with your primary GitHub email.' });
        }
        // Extract matching GitHub user details to auto-link
        const matchedUser = gitData.items[0];
        gitUsername = matchedUser.login;
        gitId = matchedUser.id.toString();
        gitAvatar = matchedUser.avatar_url;
      } else {
        const errText = await gitCheck.text();
        console.error('GitHub email check failed:', errText);
      }
    } catch (gitErr) {
      console.error('GitHub email verification error:', gitErr);
      // Fallback: don't block registration if GitHub API is completely down/unreachable
    }

    // Generate OTP
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create or update unverified user
    let user;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    
    const codedna_username = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + crypto.randomInt(1000, 9999);
    
    if (existingUser) {
      user = await prisma.user.update({
        where: { email },
        data: {
          display_name: name,
          password: hashedPassword,
          phone_number: phone,
          country_code: countryCode,
          codedna_username: existingUser.codedna_username || codedna_username,
          github_username: existingUser.github_username || gitUsername,
          github_id: existingUser.github_id || gitId,
          avatar_url: existingUser.avatar_url || gitAvatar,
        }
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          display_name: name,
          password: hashedPassword,
          phone_number: phone,
          country_code: countryCode,
          codedna_username,
          github_username: gitUsername,
          github_id: gitId,
          avatar_url: gitAvatar,
        }
      });
    }

    // Invalidate any previous unused OTPs for this email
    await prisma.otpCode.updateMany({
      where: { email, used: false },
      data: { used: true }
    });

    // Store new OTP
    await prisma.otpCode.create({
      data: { email, code, expires_at: expiresAt }
    });

    // Send Email
    try {
      await transporter.sendMail({
        from: `"Code DNA" <${process.env.GMAIL_USER || 'noreply@codedna.dev'}>`,
        to: email,
        subject: `${code} — Verify your Code DNA account`,
        html: `<h1>Welcome to Code DNA</h1><p>Your verification code is: <b>${code}</b></p>`
      });
    } catch (e) {
      console.error('Registration OTP email failed:', e.message);
    }

    console.log(`\n=========================================`);
    console.log(`🔑 DEV/RENDER LOG OTP for ${email}: ${code}`);
    console.log(`=========================================\n`);

    // Log registration
    if (user.role !== 'ADMIN') {
      await prisma.activityLog.create({
        data: {
          user_id: user.id,
          action: 'REGISTER',
          details: `User registered with email: ${email}`
        }
      });
    }

    res.json({ success: true, message: 'OTP sent to email' });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === 'P2002') {
      const field = err.meta?.target || 'field';
      return res.status(400).json({ error: `User with this ${field} already exists.` });
    }
    res.status(500).json({ error: `Registration failed: ${err.message}` });
  }
});

/**
 * POST /api/auth/login
 * Validates credentials and sends OTP for 2FA
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check Banned Status
    if (user.status === 'BANNED') {
      return res.status(403).json({ 
        error: 'Access Denied: Your technical identity has been revoked from this community.',
        banned: true 
      });
    }

    // Check Lockout
    if (user.lockout_until && user.lockout_until > new Date()) {
      const remaining = Math.ceil((user.lockout_until.getTime() - Date.now()) / 1000);
      return res.status(429).json({ 
        error: `Security Lockout active. Try again in ${remaining} seconds.`,
        lockout: true 
      });
    }

    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      // Increment failed attempts
      const newAttempts = (user.failed_attempts || 0) + 1;
      let lockoutUntil = null;

      if (newAttempts >= 3) {
        // Exponential backoff: 30s, 60s, 120s, etc.
        const delay = Math.pow(2, newAttempts - 3) * 30; 
        lockoutUntil = new Date(Date.now() + delay * 1000);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { 
          failed_attempts: newAttempts,
          lockout_until: lockoutUntil
        }
      });

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Success: Reset failed attempts
    await prisma.user.update({
      where: { id: user.id },
      data: { failed_attempts: 0, lockout_until: null }
    });

    // Generate OTP for every password login, including staff/admin accounts.
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Invalidate any previous unused OTPs for this email
    await prisma.otpCode.updateMany({
      where: { email, used: false },
      data: { used: true }
    });

    await prisma.otpCode.create({
      data: { email, code, expires_at: expiresAt }
    });

    try {
      await transporter.sendMail({
        from: `"Code DNA" <${process.env.GMAIL_USER || 'noreply@codedna.dev'}>`,
        to: email,
        subject: `${code} — Code DNA Login Verification`,
        html: `<h1>Security Check</h1><p>Your login code is: <b>${code}</b></p>`
      });
    } catch (e) {
      console.error('Login OTP email failed:', e.message);
    }

    console.log(`\n=========================================`);
    console.log(`🔑 DEV/RENDER LOG OTP for ${email}: ${code}`);
    console.log(`=========================================\n`);

    res.json({ success: true, message: 'OTP sent' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/verify
 * Final step for both registration and login
 */
router.post('/verify', async (req, res) => {
  try {
    const { email, code } = req.body;

    const otp = await prisma.otpCode.findFirst({
      where: { email, code, used: false, expires_at: { gte: new Date() } },
      orderBy: { created_at: 'desc' }
    });

    if (!otp) {
      return res.status(401).json({ error: 'Invalid or expired code' });
    }

    await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });

    const user = await prisma.user.update({
      where: { email },
      data: { email_verified: true }
    });

    // Log the successful verification
    if (user.role !== 'ADMIN') {
      await prisma.activityLog.create({
        data: {
          user_id: user.id,
          action: 'VERIFIED',
          details: `User verified email: ${email}`
        }
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.display_name,
        codedna_username: user.codedna_username,
        role: user.role,
        status: user.status,
        github_linked: !!user.github_id,
        github_id: user.github_id,
        github_username: user.github_username,
        phone: user.phone_number,
        github_token: user.github_token
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * POST /api/auth/link-github
 * Links a GitHub profile to an existing verified user
 */
router.post('/link-github', async (req, res) => {
  try {
    const { email, github_id, github_username, avatar_url, github_token } = req.body;

    if (!github_id) {
      return res.status(400).json({ error: 'GitHub ID is required' });
    }

    const githubIdStr = github_id.toString();

    // Step 1: Find ALL possible accounts that could be this person
    const userByGithubId = await prisma.user.findUnique({ 
      where: { github_id: githubIdStr },
      include: { fingerprints: true, analysis_jobs: true, activity_logs: true, vectors: true }
    });

    // Find by the email passed from GitHub
    const userByGithubEmail = email 
      ? await prisma.user.findUnique({ where: { email } })
      : null;

    // Find by github_username (for accounts created during analysis)
    const userByUsername = github_username 
      ? await prisma.user.findFirst({ 
          where: { 
            OR: [
              { github_username },
              { username: github_username },
              { codedna_username: github_username }
            ]
          }
        })
      : null;

    // Step 2: Determine who is the PRIMARY account (the one with email+password registration)
    // Priority: email-registered account > github_id account > username account
    let primaryUser = null;
    let ghostUser = null;

    // The primary user is the one who registered via email/password
    const allCandidates = [userByGithubEmail, userByGithubId, userByUsername].filter(Boolean);
    
    // Find the one with a password (= registered via email)
    primaryUser = allCandidates.find(u => u && u.password && u.email_verified) || null;
    
    // If no registered user found, pick the one with the most data
    if (!primaryUser && allCandidates.length > 0) {
      primaryUser = allCandidates[0];
    }

    if (!primaryUser) {
      // No existing account at all — this is fine, the user just hasn't registered yet
      return res.status(404).json({ error: 'No existing account found. User should register first.' });
    }

    // Step 3: Find any ghost/duplicate accounts to merge INTO the primary
    for (const candidate of allCandidates) {
      if (candidate && candidate.id !== primaryUser.id) {
        ghostUser = candidate;
        break;
      }
    }

    // Step 4: Merge ghost into primary if needed
    if (ghostUser) {
      // Transfer all data from ghost to primary
      await prisma.fingerprint.updateMany({
        where: { user_id: ghostUser.id },
        data: { user_id: primaryUser.id }
      });
      await prisma.analysisJob.updateMany({
        where: { user_id: ghostUser.id },
        data: { user_id: primaryUser.id }
      });
      await prisma.activityLog.updateMany({
        where: { user_id: ghostUser.id },
        data: { user_id: primaryUser.id }
      });
      await prisma.developerVector.updateMany({
        where: { user_id: ghostUser.id },
        data: { user_id: primaryUser.id }
      });

      // Delete the ghost
      await prisma.user.delete({ where: { id: ghostUser.id } });
    }

    // Step 5: Link GitHub to the primary account
    const updatedUser = await prisma.user.update({
      where: { id: primaryUser.id },
      data: {
        github_id: githubIdStr,
        github_username: github_username || primaryUser.github_username,
        avatar_url: avatar_url || primaryUser.avatar_url,
        github_token: github_token || primaryUser.github_token,
        // Only update codedna_username if the primary doesn't already have one
        codedna_username: primaryUser.codedna_username || github_username,
      }
    });

    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: 'Failed to link GitHub' });
  }
});
// Force link a GitHub account to an already verified email
router.post('/force-link-github', async (req, res) => {
  try {
    const { email, github_id, github_username, avatar_url, github_token } = req.body;
    
    if (!email || !github_id) {
      return res.status(400).json({ error: 'Email and GitHub ID are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        github_id: github_id.toString(),
        github_username: github_username || user.github_username,
        avatar_url: avatar_url || user.avatar_url,
        github_token: github_token || user.github_token,
        codedna_username: user.codedna_username || github_username,
      }
    });

    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: 'Failed to forcefully link GitHub' });
  }
});

module.exports = router;
