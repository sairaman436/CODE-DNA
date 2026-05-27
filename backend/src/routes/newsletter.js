const express = require('express');
const { sendMail } = require('../lib/mailer');

const router = express.Router();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

router.post('/subscribe', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }

    const fromEmail = process.env.GMAIL_USER || 'noreply@codedna.dev';
    const notifyEmail = process.env.NEWSLETTER_TO_EMAIL || process.env.GMAIL_USER || 'sairamanladi2007@gmail.com';
    const siteUrl = process.env.CODEDNA_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://codedna.dev';
    const safeEmail = escapeHtml(email);

    await sendMail({
      from: `"Code DNA" <${fromEmail}>`,
      to: notifyEmail,
      replyTo: email,
      subject: `New Code DNA sequence signup: ${email}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 28px; color: #18181b;">
          <h1 style="font-size: 22px; margin: 0 0 12px;">New Code DNA signup</h1>
          <p style="font-size: 15px; line-height: 1.6;">A visitor joined the update sequence.</p>
          <p style="font-size: 16px;"><strong>Email:</strong> ${safeEmail}</p>
          <p style="font-size: 12px; color: #71717a;">Source: ${escapeHtml(siteUrl)}</p>
        </div>
      `,
      text: `New Code DNA sequence signup: ${email}\nSource: ${siteUrl}`,
    });

    await sendMail({
      from: `"Code DNA" <${fromEmail}>`,
      to: email,
      subject: 'You joined the Code DNA sequence',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #050505; color: #e4e4e7;">
          <div style="margin-bottom: 28px;">
            <span style="color: #10b981; font-weight: 800; font-size: 16px;">Code DNA</span>
          </div>
          <h1 style="font-size: 26px; margin: 0 0 12px; color: #fff;">You are on the sequence.</h1>
          <p style="font-size: 15px; line-height: 1.7; color: #a1a1aa; margin: 0 0 28px;">
            Thanks for joining. We will send meaningful Code DNA engine updates, launch notes, and product signals to this inbox.
          </p>
          <a href="${escapeHtml(siteUrl)}" style="display: inline-block; background: #fff; color: #050505; text-decoration: none; font-size: 13px; font-weight: 800; padding: 13px 18px; border-radius: 12px;">Open Code DNA</a>
          <p style="font-size: 12px; line-height: 1.6; color: #52525b; margin-top: 32px;">
            If this was not you, you can ignore this email.
          </p>
        </div>
      `,
      text: `You joined the Code DNA sequence.\n\nOpen Code DNA: ${siteUrl}\n\nIf this was not you, you can ignore this email.`,
    });

    return res.json({ message: 'You are on the sequence.' });
  } catch (error) {
    console.error('Newsletter signup error:', error);
    return res.status(500).json({ error: 'Could not join the sequence right now.' });
  }
});

module.exports = router;
