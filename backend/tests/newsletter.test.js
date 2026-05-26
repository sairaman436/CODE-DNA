const assert = require('node:assert/strict');
const test = require('node:test');

const { createJsonApp, request } = require('./helpers');

test('POST /api/newsletter/subscribe validates email and sends notification emails', async () => {
  const sent = [];
  const app = createJsonApp('src/routes/newsletter.js', '/api/newsletter', {
    'src/lib/mailer.js': {
      sendMail: async (payload) => sent.push(payload),
    },
  });

  const invalid = await request(app, 'POST', '/api/newsletter/subscribe', {
    body: { email: 'not-an-email' },
  });
  assert.equal(invalid.status, 400);

  const response = await request(app, 'POST', '/api/newsletter/subscribe', {
    body: { email: 'Dev@Example.com ' },
  });

  assert.equal(response.status, 200);
  assert.equal(response.data.message, 'You are on the sequence.');
  assert.equal(sent.length, 2);
  assert.equal(sent[0].replyTo, 'dev@example.com');
  assert.match(sent[0].subject, /dev@example.com/);
  assert.equal(sent[1].to, 'dev@example.com');
});
