const assert = require('node:assert/strict');
const test = require('node:test');

const { loadRouteWithMocks } = require('./helpers');

function loadAnalyzeRoute(prisma = {}) {
  return loadRouteWithMocks('src/routes/analyze.js', {
    'src/lib/prisma.js': prisma,
    'src/services/github.js': {
      fetchAndFilterRepos: async () => [],
      checkGatewayRequirements: async () => ({ followed: true, starred: true }),
    },
});
}

test('getEnginePool reads comma-separated ANALYSIS_SERVICE_URLS', () => {
  const previousUrls = process.env.ANALYSIS_SERVICE_URLS;
  const previousUrl = process.env.ANALYSIS_SERVICE_URL;

  try {
    process.env.ANALYSIS_SERVICE_URLS = 'http://engine-a:8000, http://engine-b:8000,,http://engine-c:8000';
    delete process.env.ANALYSIS_SERVICE_URL;

    const route = loadAnalyzeRoute();
    assert.deepEqual(route.getEnginePool(), [
      'http://engine-a:8000',
      'http://engine-b:8000',
      'http://engine-c:8000',
    ]);
  } finally {
    restoreEnv('ANALYSIS_SERVICE_URLS', previousUrls);
    restoreEnv('ANALYSIS_SERVICE_URL', previousUrl);
  }
});

test('dispatchToEnginePool uses round-robin engines', async (t) => {
  const previousUrls = process.env.ANALYSIS_SERVICE_URLS;
  const previousFetch = global.fetch;
  const calls = [];

  t.after(() => {
    restoreEnv('ANALYSIS_SERVICE_URLS', previousUrls);
    global.fetch = previousFetch;
  });

  process.env.ANALYSIS_SERVICE_URLS = 'http://engine-a:8000,http://engine-b:8000';
  global.fetch = async (url) => {
    calls.push(url);
    return { ok: true };
  };

  const route = loadAnalyzeRoute();
  await route.dispatchToEnginePool({ jobId: 'job-1' });
  await route.dispatchToEnginePool({ jobId: 'job-2' });
  await route.dispatchToEnginePool({ jobId: 'job-3' });

  assert.deepEqual(calls.map((url) => new URL(url).origin), [
    'http://engine-a:8000',
    'http://engine-b:8000',
    'http://engine-a:8000',
  ]);
});

test('dispatchToEnginePool fails over when one engine rejects the job', async (t) => {
  const previousUrls = process.env.ANALYSIS_SERVICE_URLS;
  const previousFetch = global.fetch;
  const calls = [];

  t.after(() => {
    restoreEnv('ANALYSIS_SERVICE_URLS', previousUrls);
    global.fetch = previousFetch;
  });

  process.env.ANALYSIS_SERVICE_URLS = 'http://busy-engine:8000,http://ready-engine:8000';
  global.fetch = async (url) => {
    calls.push(url);
    if (url.startsWith('http://busy-engine:8000')) {
      return { ok: false, status: 503, statusText: 'Service Unavailable' };
    }
    return { ok: true };
  };

  const route = loadAnalyzeRoute();
  const selected = await route.dispatchToEnginePool({ jobId: 'job-1' });

  assert.equal(selected, 'http://ready-engine:8000');
  assert.deepEqual(calls.map((url) => new URL(url).origin), [
    'http://busy-engine:8000',
    'http://ready-engine:8000',
  ]);
});

test('checkMemoryRateLimit blocks repeated analysis attempts in a window', () => {
  const previousMax = process.env.CODEDNA_PUBLIC_ANALYSIS_RATE_MAX;
  const previousWindow = process.env.CODEDNA_PUBLIC_ANALYSIS_RATE_WINDOW_MS;

  try {
    process.env.CODEDNA_PUBLIC_ANALYSIS_RATE_MAX = '2';
    process.env.CODEDNA_PUBLIC_ANALYSIS_RATE_WINDOW_MS = '60000';

    const route = loadAnalyzeRoute();
    route._rateBuckets.clear();

    assert.equal(route.checkMemoryRateLimit('alice:127.0.0.1', 1000).limited, false);
    assert.equal(route.checkMemoryRateLimit('alice:127.0.0.1', 2000).limited, false);
    const blocked = route.checkMemoryRateLimit('alice:127.0.0.1', 3000);

    assert.equal(blocked.limited, true);
    assert.equal(blocked.retryAfterSeconds, 58);
  } finally {
    restoreEnv('CODEDNA_PUBLIC_ANALYSIS_RATE_MAX', previousMax);
    restoreEnv('CODEDNA_PUBLIC_ANALYSIS_RATE_WINDOW_MS', previousWindow);
  }
});

test('isPrivilegedAnalysisUser bypasses analysis limits for staff and admins', () => {
  const route = loadAnalyzeRoute();

  assert.equal(route.isPrivilegedAnalysisUser({ role: 'ADMIN' }, 'alice'), true);
  assert.equal(route.isPrivilegedAnalysisUser({ role: 'STAFF' }, 'alice'), true);
  assert.equal(route.isPrivilegedAnalysisUser({ role: 'USER' }, 'sairaman436'), true);
  assert.equal(route.isPrivilegedAnalysisUser({ role: 'USER', email: 'sairamanladi2007@gmail.com' }, 'alice'), true);
  assert.equal(route.isPrivilegedAnalysisUser({ role: 'USER' }, 'alice'), false);
});

test('resolveRequesterFromHeaders falls back to admin email when backend id is unavailable', async () => {
  const calls = [];
  const route = loadAnalyzeRoute({
    user: {
      findUnique: async (args) => {
        calls.push(['findUnique', args.where]);
        if (args.where.email === 'sairamanladi2007@gmail.com') {
          return { id: 'admin-db-id', email: 'sairamanladi2007@gmail.com', role: 'ADMIN' };
        }
        return null;
      },
      findFirst: async (args) => {
        calls.push(['findFirst', args.where]);
        return null;
      },
    },
  });

  const requester = await route.resolveRequesterFromHeaders({
    'x-user-id': 'github-provider-id-not-db-id',
    'x-user-email': 'sairamanladi2007@gmail.com',
  });

  assert.equal(requester.id, 'admin-db-id');
  assert.deepEqual(calls, [
    ['findUnique', { id: 'github-provider-id-not-db-id' }],
    ['findUnique', { email: 'sairamanladi2007@gmail.com' }],
  ]);
});

function restoreEnv(key, value) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
