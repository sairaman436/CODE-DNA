const assert = require('node:assert/strict');
const test = require('node:test');

const { checkGatewayRequirements, fetchAndFilterRepos, fetchWithTimeout } = require('../src/services/github');

test('fetchAndFilterRepos includes every non-empty repo by default', async (t) => {
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
      name: 'practice-api',
      clone_url: 'https://github.com/alice/practice-api.git',
      language: 'TypeScript',
      default_branch: 'main',
      size: 10,
    },
    {
      name: 'launch-hackathon',
      clone_url: 'https://github.com/alice/launch-hackathon.git',
      language: 'TypeScript',
      default_branch: 'main',
      size: 10,
    },
    {
      name: 'real-product',
      clone_url: 'https://github.com/alice/real-product.git',
      language: 'TypeScript',
      default_branch: 'main',
      size: 10,
    },
    {
      name: 'forked',
      clone_url: 'https://github.com/alice/forked.git',
      language: 'TypeScript',
      default_branch: 'main',
      size: 10,
    },
    {
      name: 'archived',
      clone_url: 'https://github.com/alice/archived.git',
      language: 'TypeScript',
      default_branch: 'main',
      size: 10,
    },
  ]);
});

test('fetchAndFilterRepos uses token endpoint and returns all eligible repos', async (t) => {
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

  assert.equal(repos.length, 12);
  assert.equal(repos[0].name, 'service-11');
  assert.equal(repos[11].name, 'service-0');
});

test('fetchAndFilterRepos keeps paging until GitHub is exhausted for large accounts', async (t) => {
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
        Array.from({ length: calls === 1 ? 100 : 2 }, (_, index) =>
          repo({
            name: `page-${calls}-service-${index}`,
            pushed_at: new Date(Date.UTC(2026, calls, index + 1)).toISOString(),
          })
        ),
    };
  };

  const repos = await fetchAndFilterRepos('alice');

  assert.equal(calls, 2);
  assert.equal(repos.length, 102);
});

test('fetchAndFilterRepos includes giant repositories by default for complete analysis', async (t) => {
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

  assert.deepEqual(repos.map((item) => item.name), ['huge-monolith', 'right-sized-service']);
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

test('checkGatewayRequirements verifies follow and star with an access token', async (t) => {
  const originalFetch = global.fetch;
  const calls = [];
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url, options) => {
    calls.push({ url, authorization: options.headers.Authorization });
    return { status: 204, ok: true, json: async () => ({}) };
  };

  const result = await checkGatewayRequirements('alice', 'secret-token');

  assert.deepEqual(result, { followed: true, starred: true });
  assert.deepEqual(calls.map((call) => call.url), [
    'https://api.github.com/user/following/sairaman436',
    'https://api.github.com/user/starred/sairaman436/CODE-DNA',
  ]);
  assert.ok(calls.every((call) => call.authorization === 'token secret-token'));
});

test('checkGatewayRequirements reports missing follow and star', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url) => {
    if (url.includes('/following/')) {
      return { status: 404, ok: false, json: async () => ({}) };
    }
    return { status: 200, ok: true, json: async () => [] };
  };

  const result = await checkGatewayRequirements('alice');

  assert.deepEqual(result, { followed: false, starred: false });
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
