const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const backendRoot = path.resolve(__dirname, '..');

function loadMailer() {
  const resolved = require.resolve(path.join(backendRoot, 'src/lib/mailer.js'));
  delete require.cache[resolved];
  return require(resolved);
}

test('mailer sends through Resend API when RESEND_API_KEY is configured', async (t) => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;
  const calls = [];

  t.after(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
    delete require.cache[require.resolve(path.join(backendRoot, 'src/lib/mailer.js'))];
  });

  process.env.RESEND_API_KEY = 're_test_key';
  process.env.MAIL_FROM = 'Code DNA <mail@codedna.dev>';
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      status: 200,
      json: async () => ({ id: 'email_123' }),
      text: async () => '',
    };
  };

  const mailer = loadMailer();
  const result = await mailer.sendMail({
    from: 'Ignored <ignored@example.com>',
    to: 'one@example.com, two@example.com',
    replyTo: 'reply@example.com',
    subject: 'Verification',
    html: '<p>Code</p>',
    text: 'Code',
  });

  assert.deepEqual(result, { id: 'email_123' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.resend.com/emails');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer re_test_key');

  const body = JSON.parse(calls[0].options.body);
  assert.deepEqual(body, {
    from: 'Code DNA <mail@codedna.dev>',
    to: ['one@example.com', 'two@example.com'],
    reply_to: 'reply@example.com',
    subject: 'Verification',
    html: '<p>Code</p>',
    text: 'Code',
  });
});

test('normalizeRecipients accepts arrays and comma separated strings', () => {
  const { normalizeRecipients } = loadMailer();

  assert.deepEqual(normalizeRecipients(['a@example.com', '', 'b@example.com']), [
    'a@example.com',
    'b@example.com',
  ]);
  assert.deepEqual(normalizeRecipients('a@example.com, b@example.com'), [
    'a@example.com',
    'b@example.com',
  ]);
});
