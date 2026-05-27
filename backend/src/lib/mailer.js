const nodemailer = require('nodemailer');

function normalizeRecipients(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean);
  }

  return [];
}

function getDefaultFrom() {
  if (process.env.MAIL_FROM) {
    return process.env.MAIL_FROM;
  }

  if (process.env.GMAIL_USER) {
    return `"Code DNA" <${process.env.GMAIL_USER}>`;
  }

  return 'Code DNA <sairamanladi2007@gmail.com>';
}

function createSmtpTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER || 'sairamanladi2007@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD || 'ogxxzcnlehyfwofa',
    },
    connectionTimeout: 5000, // 5 seconds max to connect
    greetingTimeout: 5000,   // 5 seconds max for SMTP greeting
    socketTimeout: 5000,     // 5 seconds max for inactive socket
  });
}

async function sendWithResend(payload) {
  // Resend free tier requires sending from onboarding@resend.dev unless a custom domain is verified.
  // We override the from field to prevent API validation errors.
  const fromEmail = process.env.MAIL_FROM || 'Code DNA <onboarding@resend.dev>';

  const body = {
    from: fromEmail,
    to: normalizeRecipients(payload.to),
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  };

  // Set reply_to if payload had a specific from address
  if (payload.from && !process.env.MAIL_FROM) {
    const match = payload.from.match(/<([^>]+)>/);
    const replyTo = match ? match[1] : payload.from;
    if (!body.reply_to) {
      body.reply_to = replyTo;
    }
  }

  if (payload.replyTo) {
    body.reply_to = payload.replyTo;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend API ${response.status}: ${detail}`);
  }

  return response.json().catch(() => ({}));
}

async function sendWithGmail(payload) {
  const transporter = createSmtpTransporter();
  return transporter.sendMail({
    ...payload,
    from: payload.from || getDefaultFrom(),
  });
}

async function sendMail(payload) {
  // Strategy: Try Resend HTTP API first (instant, works on Render)
  // If Resend fails or no key, fall back to Gmail SMTP (worked yesterday)
  
  if (process.env.RESEND_API_KEY) {
    try {
      console.log('📧 Trying Resend HTTP API...');
      const result = await sendWithResend(payload);
      console.log('✅ Email sent via Resend successfully!');
      return result;
    } catch (err) {
      console.error('⚠️ Resend failed:', err.message);
      console.log('📧 Falling back to Gmail SMTP...');
    }
  }

  // Fallback: Gmail SMTP (this worked yesterday on Render)
  try {
    const result = await sendWithGmail(payload);
    console.log('✅ Email sent via Gmail SMTP successfully!');
    return result;
  } catch (err) {
    console.error('❌ Gmail SMTP also failed:', err.message);
    throw err;
  }
}

module.exports = {
  sendMail,
  normalizeRecipients,
};
