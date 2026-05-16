const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'noreply@codedna.dev',
    pass: process.env.GMAIL_APP_PASSWORD || '',
  },
});

module.exports = transporter;
