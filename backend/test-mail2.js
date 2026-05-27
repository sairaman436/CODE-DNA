require('dns').setDefaultResultOrder('ipv4first');
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  }
});

async function test() {
  console.log('Sending email...');
  try {
    await transporter.sendMail({
      to: process.env.GMAIL_USER,
      subject: 'Test Email IPv4',
      html: '<h1>Test</h1>'
    });
    console.log('Email sent successfully!');
  } catch (e) {
    console.error('Failed to send:', e);
  }
  process.exit(0);
}

test();
