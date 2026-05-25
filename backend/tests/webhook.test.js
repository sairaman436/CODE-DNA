const assert = require('node:assert/strict');
const test = require('node:test');

const { createJsonApp, request } = require('./helpers');

test('POST /api/webhook/results rejects missing payload fields', async () => {
  const app = createJsonApp('src/routes/webhook.js', '/api/webhook', {
    'src/lib/prisma.js': {},
  });

  const response = await request(app, 'POST', '/api/webhook/results', {
    body: { jobId: 'job-1' },
  });

  assert.equal(response.status, 400);
  assert.equal(response.data.error, 'Missing required fields');
});

test('webhook routes reject invalid shared secret when WEBHOOK_SECRET is configured', async (t) => {
  const previous = process.env.WEBHOOK_SECRET;
  process.env.WEBHOOK_SECRET = 'prod-secret';
  t.after(() => {
    if (previous === undefined) {
      delete process.env.WEBHOOK_SECRET;
    } else {
      process.env.WEBHOOK_SECRET = previous;
    }
  });

  const app = createJsonApp('src/routes/webhook.js', '/api/webhook', {
    'src/lib/prisma.js': {},
  });

  const missing = await request(app, 'POST', '/api/webhook/progress', {
    body: { jobId: 'job-1', progress: 20 },
  });
  assert.equal(missing.status, 401);

  const invalid = await request(app, 'POST', '/api/webhook/progress', {
    headers: { 'x-webhook-secret': 'wrong-secret' },
    body: { jobId: 'job-1', progress: 20 },
  });
  assert.equal(invalid.status, 401);
});

test('POST /api/webhook/results rejects malformed score contracts', async () => {
  const app = createJsonApp('src/routes/webhook.js', '/api/webhook', {
    'src/lib/prisma.js': {},
  });

  const response = await request(app, 'POST', '/api/webhook/results', {
    body: {
      jobId: 'job-1',
      userId: 'user-1',
      results: { scores: { readability: 99 } },
    },
  });

  assert.equal(response.status, 400);
  assert.equal(response.data.error, 'Invalid analysis scores');
});

test('POST /api/webhook/results stores fingerprint details and upserts existing vector', async () => {
  const calls = [];
  const prisma = {
    analysisJob: {
      update: async (args) => {
        calls.push(['analysisJob.update', args]);
        return {};
      },
    },
    fingerprint: {
      create: async (args) => {
        calls.push(['fingerprint.create', args]);
        return { id: 'fingerprint-1' };
      },
    },
    languageStat: {
      create: async (args) => calls.push(['languageStat.create', args]),
    },
    commitPattern: {
      create: async (args) => calls.push(['commitPattern.create', args]),
    },
    user: {
      update: async (args) => calls.push(['user.update', args]),
    },
    developerVector: {
      findFirst: async () => ({ id: 'vector-1' }),
      update: async (args) => calls.push(['developerVector.update', args]),
      create: async (args) => calls.push(['developerVector.create', args]),
    },
  };

  const app = createJsonApp('src/routes/webhook.js', '/api/webhook', {
    'src/lib/prisma.js': prisma,
  });

  const response = await request(app, 'POST', '/api/webhook/results', {
    body: {
      jobId: 'job-1',
      userId: 'user-1',
      results: sampleResults(),
    },
  });

  assert.equal(response.status, 200);
  assert.equal(response.data.fingerprintId, 'fingerprint-1');
  assert.equal(calls.filter(([name]) => name === 'languageStat.create').length, 2);
  assert.ok(calls.some(([name]) => name === 'commitPattern.create'));
  assert.ok(calls.some(([name]) => name === 'developerVector.update'));
  assert.ok(!calls.some(([name]) => name === 'developerVector.create'));

  const fingerprintCall = calls.find(([name]) => name === 'fingerprint.create')[1];
  assert.equal(fingerprintCall.data.readability_score, 91);
  assert.equal(fingerprintCall.data.strengths, JSON.stringify(['Readability']));
});

test('POST /api/webhook/progress updates only supplied fields', async () => {
  let updateArgs;
  const prisma = {
    analysisJob: {
      update: async (args) => {
        updateArgs = args;
        return {};
      },
    },
  };

  const app = createJsonApp('src/routes/webhook.js', '/api/webhook', {
    'src/lib/prisma.js': prisma,
  });

  const response = await request(app, 'POST', '/api/webhook/progress', {
    body: { jobId: 'job-1', step: 'Cloning repositories' },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(updateArgs.data, {
    progress: undefined,
    current_step: 'Cloning repositories',
  });
});

function sampleResults() {
  return {
    scores: {
      readability: 91,
      complexity: 82,
      documentation: 73,
      test_mindset: 64,
      commit_discipline: 55,
      language_depth: 46,
      refactor_tendency: 37,
      error_handling: 28,
    },
    developer_type: 'The Architect',
    personality_summary: 'Clean and structured.',
    strengths: ['Readability'],
    growth_areas: ['Error Handling'],
    repos_analyzed: 2,
    total_files_analyzed: 40,
    activity_pulse: [0, 1],
    language_stats: [
      { language: 'TypeScript', total_lines: 1200, total_commits: 4, trend: 'up' },
      { language: 'Python', total_lines: 300 },
    ],
    commit_patterns: {
      avg_message_length: 44.5,
      commit_style: 'Descriptive',
      most_active_hour: 14,
      most_active_day: 'Tuesday',
      avg_commit_size: 88,
      fix_to_feature_ratio: 0.25,
      emoji_usage_pct: 0,
      naming_style: 'camelCase',
      avg_fn_length: 12,
    },
  };
}
