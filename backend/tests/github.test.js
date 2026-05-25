const assert = require('node:assert/strict');
const test = require('node:test');

const { fetchAndFilterRepos, fetchWithTimeout } = require('../src/services/github');

test('fetchAndFilterRepos filters forks archives empty learning and hackathon repos', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url, options) => {
    assert.match(url, /users\/alice\/repos/);
    assert.equal(options.headers['User-Agent'], 'CodeDNA-Engine/1.0');
    return {
      ok: true,
      json: async () => [
        repo({ name: 'real-product', pushed_at: '2026-05-20T00:00:00Z' }),
        repo({ name: 'practice-api', pushed_at: '2026-05-25T00:00:00Z' }),
        repo({ name: 'launch-hackathon', pushed_at: '2026-05-24T00:00:00Z' }),
        repo({ name: 'forked', fork: true }),
        repo({ name: 'archived', archived: true }),
        repo({ name: 'empty', size: 0 }),
      ],
    };
  };

  const repos = await fetchAndFilterRepos('alice');

  assert.deepEqual(repos, [
    {
      name: 'real-product',
      clone_url: 'https://github.com/alice/real-product.git',
      language: 'TypeScript',
      default_branch: 'main',
      size: 10,
    },
  ]);
});

test('fetchAndFilterRepos uses token endpoint and caps results to 10 recent repos', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url, options) => {
    assert.match(url, /user\/repos/);
    assert.equal(options.headers.Authorization, 'token secret-token');
    return {
      ok: true,
      json: async () =>
        Array.from({ length: 12 }, (_, index) =>
          repo({
            name: `service-${index}`,
            pushed_at: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
          })
        ),
    };
  };

  const repos = await fetchAndFilterRepos('ignored-when-token-present', 'secret-token');

  assert.equal(repos.length, 10);
  assert.equal(repos[0].name, 'service-11');
  assert.equal(repos[9].name, 'service-2');
});

test('fetchAndFilterRepos stops paging after enough eligible repos for large accounts', async (t) => {
  const originalFetch = global.fetch;
  let calls = 0;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async () => {
    calls++;
    return {
      ok: true,
      json: async () =>
        Array.from({ length: 100 }, (_, index) =>
          repo({
            name: `recent-service-${index}`,
            pushed_at: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
          })
        ),
    };
  };

  const repos = await fetchAndFilterRepos('alice');

  assert.equal(calls, 1);
  assert.equal(repos.length, 10);
});

test('fetchAndFilterRepos skips giant repositories by default', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async () => ({
    ok: true,
    json: async () => [
      repo({ name: 'huge-monolith', size: 250000, pushed_at: '2026-05-25T00:00:00Z' }),
      repo({ name: 'right-sized-service', size: 4200, pushed_at: '2026-05-24T00:00:00Z' }),
    ],
  });

  const repos = await fetchAndFilterRepos('alice');

  assert.deepEqual(repos.map((item) => item.name), ['right-sized-service']);
});

test('fetchAndFilterRepos surfaces GitHub API errors', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async () => ({ ok: false, status: 403, statusText: 'Forbidden' });

  await assert.rejects(
    () => fetchAndFilterRepos('alice'),
    /GitHub API Error: 403 Forbidden/
  );
});

test('fetchWithTimeout aborts stalled GitHub requests', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url, options) =>
    new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        reject(error);
      });
    });

  await assert.rejects(
    () => fetchWithTimeout('https://api.github.com/stall', {}, 1),
    /GitHub API timeout after 1ms/
  );
});

function repo(overrides = {}) {
  const name = overrides.name || 'repo';
  return {
    name,
    description: '',
    fork: false,
    archived: false,
    size: 10,
    clone_url: `https://github.com/alice/${name}.git`,
    language: 'TypeScript',
    default_branch: 'main',
    pushed_at: '2026-05-01T00:00:00Z',
    ...overrides,
  };
}
