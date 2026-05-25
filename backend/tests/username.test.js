const assert = require('node:assert/strict');
const test = require('node:test');

const { createJsonApp, request } = require('./helpers');

test('GET /api/username/check validates missing invalid reserved duplicate and available names', async () => {
  const prisma = {
    user: {
      findFirst: async ({ where }) =>
        where.codedna_username === 'taken_name' ? { id: 'existing-user' } : null,
    },
  };
  const app = createJsonApp('src/routes/username.js', '/api/username', {
    'src/lib/prisma.js': prisma,
  });

  assert.deepEqual((await request(app, 'GET', '/api/username/check')).data, {
    available: false,
    reason: 'Username is required',
  });
  assert.equal((await request(app, 'GET', '/api/username/check?q=1bad')).data.available, false);
  assert.equal((await request(app, 'GET', '/api/username/check?q=admin')).data.reason, 'This username is reserved.');
  assert.equal((await request(app, 'GET', '/api/username/check?q=taken_name')).data.reason, 'This username is already taken.');
  assert.deepEqual((await request(app, 'GET', '/api/username/check?q=Fresh_User')).data, {
    available: true,
    username: 'fresh_user',
  });
});

test('POST /api/username/claim enforces format reserved user existence duplicates and cooldown', async () => {
  const users = {
    availableUser: { id: 'availableUser', codedna_username: null },
    cooldownUser: {
      id: 'cooldownUser',
      codedna_username: 'old_name',
      username_changed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  };

  const prisma = {
    user: {
      findUnique: async ({ where }) => users[where.id] || null,
      findFirst: async ({ where }) =>
        where.codedna_username === 'taken_name' ? { id: 'other-user' } : null,
      update: async ({ where, data }) => ({
        ...users[where.id],
        ...data,
      }),
    },
  };
  const app = createJsonApp('src/routes/username.js', '/api/username', {
    'src/lib/prisma.js': prisma,
  });

  assert.equal((await request(app, 'POST', '/api/username/claim', { body: { user_id: 'availableUser', username: '1bad' } })).status, 400);
  assert.equal((await request(app, 'POST', '/api/username/claim', { body: { user_id: 'availableUser', username: 'admin' } })).status, 400);
  assert.equal((await request(app, 'POST', '/api/username/claim', { body: { user_id: 'missing', username: 'fresh_name' } })).status, 404);
  assert.equal((await request(app, 'POST', '/api/username/claim', { body: { user_id: 'availableUser', username: 'taken_name' } })).status, 409);
  assert.equal((await request(app, 'POST', '/api/username/claim', { body: { user_id: 'cooldownUser', username: 'new_name' } })).status, 429);

  const success = await request(app, 'POST', '/api/username/claim', {
    body: { user_id: 'availableUser', username: 'Fresh_Name' },
  });
  assert.equal(success.status, 200);
  assert.equal(success.data.codedna_username, 'fresh_name');
});
