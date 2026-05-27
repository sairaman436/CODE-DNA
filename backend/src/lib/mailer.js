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

function getApiDefaultFrom() {
  // Resend free tier requires sending from their onboarding address
  // unless you verify your own domain
  return process.env.MAIL_FROM || 'Code DNA <onboarding@resend.dev>';
}

function createSmtpTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER || 'sairamanladi2007@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD || 'ogxxzcnlehyfwofa',
    },
  });
}

async function sendWithResend(payload) {
  const body = {
    from: payload.from || getApiDefaultFrom(),
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
  // Use Resend HTTP API (works on Render free tier, no SMTP ports needed)
  if (process.env.RESEND_API_KEY) {
    console.log('📧 Sending email via Resend API...');
    return sendWithResend(payload);
  }

  // Fallback to Gmail SMTP for local development
  console.log('📧 Sending email via Gmail SMTP (fallback)...');
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
