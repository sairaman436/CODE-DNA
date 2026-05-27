const mailer = require('./src/lib/mailer');
require('dotenv').config();

async function test() {
  console.log('Sending email...');
  try {
    await mailer.sendMail({
      to: process.env.GMAIL_USER,
      subject: 'Test Email',
      html: '<h1>Test</h1>'
    });
    console.log('Email sent successfully!');
  } catch (e) {
    console.error('Failed to send:', e);
  }
  process.exit(0);
}

test();
