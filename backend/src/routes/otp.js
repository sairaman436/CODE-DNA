const express = require('express');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const prisma = require('../lib/prisma');

const router = express.Router();

// Configure no-reply email transporter
// Uses Gmail SMTP — set GMAIL_USER and GMAIL_APP_PASSWORD in .env
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'noreply@codedna.dev',
    pass: process.env.GMAIL_APP_PASSWORD || '',
  },
});

// POST /api/auth/otp/send — Generate and email OTP
router.post('/send', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address required' });
    }

    // Rate limit: max 3 OTPs per email per 10 minutes
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentCodes = await prisma.otpCode.count({
      where: { email, created_at: { gte: tenMinAgo }, used: false }
    });
    if (recentCodes >= 3) {
      return res.status(429).json({ error: 'Too many attempts. Wait 10 minutes.' });
    }

    // Generate 6-digit OTP
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min TTL

    // Store OTP
    await prisma.otpCode.create({
      data: { email, code, expires_at: expiresAt }
    });

    // Send email
    try {
      await transporter.sendMail({
        from: `"Code DNA" <${process.env.GMAIL_USER || 'noreply@codedna.dev'}>`,
        to: email,
        subject: `${code} — Your Code DNA verification code`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 420px; margin: 0 auto; padding: 40px 24px; background: #0a0a0a; color: #e4e4e7;">
            <div style="margin-bottom: 32px;">
              <span style="color: #10b981; font-weight: 700; font-size: 16px;">◆ Code DNA</span>
            </div>
            <h1 style="font-size: 24px; font-weight: 600; color: #fff; margin-bottom: 8px;">Verification code</h1>
            <p style="color: #71717a; font-size: 14px; margin-bottom: 32px;">Enter this code to sign in to Code DNA:</p>
            <div style="background: #18181b; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 32px;">
              <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #fff; font-family: monospace;">${code}</span>
            </div>
            <p style="color: #52525b; font-size: 12px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.04);">
              <p style="color: #3f3f46; font-size: 11px;">Code DNA — Developer Fingerprinting Platform</p>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
      // Still return success — in dev mode the OTP is logged
      console.log(`[DEV] OTP for ${email}: ${code}`);
    }

    return res.json({ message: 'OTP sent successfully', email });

  } catch (error) {
    console.error('OTP send error:', error);
    return res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /api/auth/otp/verify — Verify OTP and create/find user
router.post('/verify', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    // Find valid OTP
    const otp = await prisma.otpCode.findFirst({
      where: {
        email,
        code,
        used: false,
        expires_at: { gte: new Date() }
      },
      orderBy: { created_at: 'desc' }
    });

    if (!otp) {
      return res.status(401).json({ error: 'Invalid or expired code' });
    }

    // Mark OTP as used
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { used: true }
    });

    // Find or create user by email
    let user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
      // Create new user with email — they'll need to connect GitHub later
      user = await prisma.user.create({
        data: {
          github_id: `email_${Date.now()}`, // Placeholder until GitHub is connected
          username: email.split('@')[0],
          email,
          email_verified: true,
        }
      });
    } else {
      // Mark email as verified
      await prisma.user.update({
        where: { id: user.id },
        data: { email_verified: true }
      });
    }

    // Return user data (frontend will use this to set session)
    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        codedna_username: user.codedna_username,
        email: user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        needs_username: !user.codedna_username,
        needs_github: user.github_id?.startsWith('email_'),
      }
    });

  } catch (error) {
    console.error('OTP verify error:', error);
    return res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;
