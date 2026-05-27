const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // use STARTTLS
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  }
});

async function test() {
  console.log('Sending email...');
  const start = Date.now();
  try {
    await transporter.sendMail({
      to: process.env.GMAIL_USER,
      subject: 'Test Email 587',
      html: '<h1>Test</h1>'
    });
    console.log(`Email sent successfully in ${Date.now() - start}ms!`);
  } catch (e) {
    console.error('Failed to send:', e);
  }
  process.exit(0);
}

test();
