const assert = require('node:assert/strict');
const test = require('node:test');
const bcrypt = require('bcryptjs');

const { createJsonApp, request } = require('./helpers');

test('POST /api/auth/register validates required fields and GitHub email ownership', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  const prisma = {
    user: {
      findFirst: async () => null,
      findUnique: async () => null,
      create: async () => ({ id: 'user-1', role: 'USER' }),
    },
    otpCode: {
      updateMany: async () => {},
      create: async () => {},
    },
    activityLog: {
      create: async () => {},
    },
  };
  const app = createJsonApp('src/routes/auth.js', '/api/auth', {
    'src/lib/prisma.js': prisma,
    'src/lib/mailer.js': { sendMail: async () => {} },
  });

  assert.equal((await request(app, 'POST', '/api/auth/register', { body: {} })).status, 400);

  global.fetch = async () => ({
    ok: true,
    json: async () => ({ total_count: 0, items: [] }),
  });
  const response = await request(app, 'POST', '/api/auth/register', {
    body: {
      name: 'Alice',
      email: 'alice@example.com',
      password: 'Secure123!',
      phone: '5551112222',
    },
  });

  assert.equal(response.status, 400);
  assert.match(response.data.error, /not associated with any GitHub account/);
});

test('POST /api/auth/register invalidates previous OTPs and stores linked GitHub user', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  const calls = [];
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      total_count: 1,
      items: [{ login: 'alicehub', id: 123, avatar_url: 'https://avatar.test/a.png' }],
    }),
  });

  const prisma = {
    user: {
      findFirst: async () => null,
      findUnique: async () => null,
      create: async (args) => {
        calls.push(['user.create', args]);
        return { id: 'user-1', role: 'USER' };
      },
    },
    otpCode: {
      updateMany: async (args) => calls.push(['otpCode.updateMany', args]),
      create: async (args) => calls.push(['otpCode.create', args]),
    },
    activityLog: {
      create: async (args) => calls.push(['activityLog.create', args]),
    },
  };
  const app = createJsonApp('src/routes/auth.js', '/api/auth', {
    'src/lib/prisma.js': prisma,
    'src/lib/mailer.js': { sendMail: async () => {} },
  });

  const response = await request(app, 'POST', '/api/auth/register', {
    body: {
      name: 'Alice Liddell',
      email: 'alice@example.com',
      password: 'Secure123!',
      phone: '5551112222',
      countryCode: '+1',
    },
  });

  assert.equal(response.status, 200);
  const createUser = calls.find(([name]) => name === 'user.create')[1];
  assert.equal(createUser.data.github_username, 'alicehub');
  assert.equal(createUser.data.github_id, '123');
  assert.ok(calls.some(([name]) => name === 'otpCode.updateMany'));
  assert.ok(calls.some(([name]) => name === 'otpCode.create'));
});

test('POST /api/auth/login blocks banned users and locks out repeated failures', async () => {
  let user = {
    id: 'user-1',
    email: 'alice@example.com',
    password: await bcrypt.hash('RightPass123!', 4),
    failed_attempts: 2,
    status: 'ACTIVE',
    role: 'USER',
  };

  const prisma = {
    user: {
      findFirst: async () => user,
      update: async ({ data }) => {
        user = { ...user, ...data };
        return user;
      },
    },
    otpCode: {
      updateMany: async () => {},
      create: async () => {},
    },
  };
  const app = createJsonApp('src/routes/auth.js', '/api/auth', {
    'src/lib/prisma.js': prisma,
    'src/lib/mailer.js': { sendMail: async () => {} },
  });

  const badPassword = await request(app, 'POST', '/api/auth/login', {
    body: { email: 'alice@example.com', password: 'wrong' },
  });
  assert.equal(badPassword.status, 401);
  assert.equal(user.failed_attempts, 3);
  assert.ok(user.lockout_until instanceof Date);

  const locked = await request(app, 'POST', '/api/auth/login', {
    body: { email: 'alice@example.com', password: 'RightPass123!' },
  });
  assert.equal(locked.status, 429);

  user = { ...user, status: 'BANNED', lockout_until: null };
  const banned = await request(app, 'POST', '/api/auth/login', {
    body: { email: 'alice@example.com', password: 'RightPass123!' },
  });
  assert.equal(banned.status, 403);
  assert.equal(banned.data.banned, true);
});

test('POST /api/auth/verify consumes current OTP and returns safe user payload', async () => {
  const calls = [];
  const prisma = {
    otpCode: {
      findFirst: async () => ({ id: 'otp-1' }),
      update: async (args) => calls.push(['otpCode.update', args]),
    },
    user: {
      update: async () => ({
        id: 'user-1',
        email: 'alice@example.com',
        display_name: 'Alice',
        codedna_username: 'alice',
        role: 'USER',
        status: 'ACTIVE',
        github_id: '123',
        github_username: 'alicehub',
        phone_number: '5551112222',
      }),
    },
    activityLog: {
      create: async (args) => calls.push(['activityLog.create', args]),
    },
  };
  const app = createJsonApp('src/routes/auth.js', '/api/auth', {
    'src/lib/prisma.js': prisma,
    'src/lib/mailer.js': { sendMail: async () => {} },
  });

  const response = await request(app, 'POST', '/api/auth/verify', {
    body: { email: 'alice@example.com', code: '123456' },
  });

  assert.equal(response.status, 200);
  assert.equal(response.data.user.github_linked, true);
  assert.equal(response.data.user.github_username, 'alicehub');
  assert.ok(!('password' in response.data.user));
  assert.ok(calls.some(([name]) => name === 'otpCode.update'));
});
