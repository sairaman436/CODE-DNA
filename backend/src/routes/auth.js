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
    const existingUser = await prisma.user.findUnique({ where: { email } });
    
    if (existingUser) {
      await prisma.user.update({
        where: { email },
        data: {
          display_name: name,
          password: hashedPassword,
          phone_number: phone,
          country_code: countryCode,
        }
      });
    } else {
      await prisma.user.create({
        data: {
          email,
          display_name: name,
          password: hashedPassword,
          phone_number: phone,
          country_code: countryCode,
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

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate OTP for Login
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

    const user = await prisma.user.update({
      where: { email },
      data: {
        github_id,
        github_username,
        avatar_url,
      }
    });

    res.json({ success: true, user });
  } catch (err) {
    console.error('Linking error:', err);
    res.status(500).json({ error: 'Failed to link GitHub' });
  }
});

module.exports = router;
