const assert = require('node:assert/strict');
const test = require('node:test');
const bcrypt = require('bcryptjs');

const { createJsonApp, request } = require('./helpers');

test('PUT /api/settings/password changes password after current password verification', async () => {
  let user = {
    id: 'user-1',
    email: 'alice@example.com',
    role: 'USER',
    github_id: '123',
    password: await bcrypt.hash('OldPass123!', 4),
    failed_attempts: 2,
    lockout_until: new Date(),
  };
  const calls = [];

  const prisma = {
    user: {
      findUnique: async ({ where }) => {
        assert.equal(where.id, 'user-1');
        return user;
      },
      update: async ({ data }) => {
        calls.push(['user.update', data]);
        user = { ...user, ...data };
        return user;
      },
    },
    otpCode: {
      updateMany: async (args) => calls.push(['otpCode.updateMany', args]),
    },
    activityLog: {
      create: async (args) => calls.push(['activityLog.create', args]),
    },
  };

  const app = createJsonApp('src/routes/settings.js', '/api/settings', {
    'src/lib/prisma.js': prisma,
  });

  const wrong = await request(app, 'PUT', '/api/settings/password', {
    headers: { 'x-user-id': 'user-1' },
    body: { current_password: 'WrongPass123!', new_password: 'NewPass123!' },
  });
  assert.equal(wrong.status, 401);

  const response = await request(app, 'PUT', '/api/settings/password', {
    headers: { 'x-user-id': 'user-1' },
    body: { current_password: 'OldPass123!', new_password: 'NewPass123!' },
  });

  assert.equal(response.status, 200);
  assert.equal(response.data.message, 'Password updated successfully');
  assert.equal(user.failed_attempts, 0);
  assert.equal(user.lockout_until, null);
  assert.equal(await bcrypt.compare('NewPass123!', user.password), true);
  assert.ok(calls.some(([name]) => name === 'otpCode.updateMany'));
  assert.ok(calls.some(([name]) => name === 'activityLog.create'));
});
