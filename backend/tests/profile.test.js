const assert = require('node:assert/strict');
const test = require('node:test');

const { createJsonApp, request } = require('./helpers');

function buildUser(overrides = {}) {
  return {
    id: 'user-1',
    username: 'masteradmin',
    codedna_username: 'masteradmin',
    github_username: 'sairaman436',
    display_name: 'Sai',
    avatar_url: 'https://avatar.test/sai.png',
    last_analyzed_at: null,
    role: 'USER',
    staff_type: null,
    bio: null,
    cover_url: null,
    accent_theme: 'emerald',
    pinned_badges: '',
    created_at: new Date('2026-01-01T00:00:00Z'),
    fingerprints: [],
    ...overrides,
  };
}

test('GET /api/profile/:username resolves profiles by GitHub username', async () => {
  const calls = [];
  const app = createJsonApp('src/routes/profile.js', '/api/profile', {
    'src/lib/prisma.js': {
      user: {
        findFirst: async (args) => {
          calls.push(args.where);
          if (args.where.github_username === 'sairaman436') {
            return buildUser();
          }
          return null;
        },
      },
    },
  });

  const response = await request(app, 'GET', '/api/profile/sairaman436');

  assert.equal(response.status, 200);
  assert.equal(response.data.user.github_username, 'sairaman436');
  assert.equal(response.data.user.codedna_username, 'masteradmin');
  assert.deepEqual(calls, [
    { codedna_username: 'sairaman436' },
    { username: 'sairaman436' },
    { github_username: 'sairaman436' },
  ]);
});
