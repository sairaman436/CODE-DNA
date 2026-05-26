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

  return 'Code DNA <onboarding@resend.dev>';
}

function createSmtpTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER || 'noreply@codedna.dev',
      pass: process.env.GMAIL_APP_PASSWORD || '',
    },
  });
}

async function sendWithResend(payload) {
  if (typeof fetch !== 'function') {
    throw new Error('Resend email delivery requires Node 18+ fetch support.');
  }

  const body = {
    from: process.env.MAIL_FROM || payload.from || getDefaultFrom(),
    to: normalizeRecipients(payload.to),
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  };

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
    throw new Error(`Resend email failed with ${response.status}: ${detail}`);
  }

  return response.json().catch(() => ({}));
}

async function sendMail(payload) {
  if (process.env.RESEND_API_KEY) {
    return sendWithResend(payload);
  }

  const transporter = createSmtpTransporter();
  return transporter.sendMail({
    ...payload,
    from: payload.from || getDefaultFrom(),
  });
}

module.exports = {
  sendMail,
  normalizeRecipients,
};
