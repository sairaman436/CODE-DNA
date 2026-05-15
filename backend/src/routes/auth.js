const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const prisma = require('../lib/prisma');

const router = express.Router();

// Transporter configuration (Gmail Mock)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'noreply@codedna.dev',
    pass: process.env.GMAIL_APP_PASSWORD || '',
  },
});

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
        }
      });
    }

    // Store OTP
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
      console.log('\n' + '='.repeat(50));
      console.log(`🔑 DEVELOPMENT OTP for ${email}: ${code}`);
      console.log('='.repeat(50) + '\n');
    }

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

    // Bypass OTP for ADMINs
    if (user.role === 'ADMIN') {
      // No log for master admin as requested
      return res.json({ 
        success: true, 
        bypassOtp: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.display_name,
          role: user.role,
          github_linked: !!user.github_id
        }
      });
    }

    // Generate OTP for regular users
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

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
      console.log(`[DEV] Login OTP for ${email}: ${code}`);
    }

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
        github_linked: !!user.github_id,
        phone: user.phone_number
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
    const { email, github_id, github_username, avatar_url } = req.body;

    if (!email || !github_id) {
      return res.status(400).json({ error: 'Email and GitHub ID are required' });
    }

    // Check if another user already has this github_id
    const duplicateUser = await prisma.user.findUnique({ 
      where: { github_id: github_id.toString() } 
    });

    if (duplicateUser && duplicateUser.email !== email) {
      // For simplicity, we delete the "ghost" user created by the analyzer or other flows
      await prisma.user.delete({ where: { id: duplicateUser.id } });
    }

    const user = await prisma.user.update({
      where: { email },
      data: {
        github_id: github_id.toString(),
        github_username,
        avatar_url,
        codedna_username: github_username, // Sync with GitHub username by default
      }
    });

    res.json({ success: true, user });
  } catch (err) {
    console.error('Linking error:', err);
    res.status(500).json({ error: 'Failed to link GitHub' });
  }
});

module.exports = router;
