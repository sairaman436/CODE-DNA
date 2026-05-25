const express = require('express');
const prisma = require('../lib/prisma');
const { fetchAndFilterRepos } = require('../services/github');

const router = express.Router();
const ENGINE_REQUEST_TIMEOUT_MS = Number(process.env.ENGINE_REQUEST_TIMEOUT_MS || 5000);
let nextEngineIndex = 0;

function engineHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.WEBHOOK_SECRET) {
    headers['x-webhook-secret'] = process.env.WEBHOOK_SECRET;
  }
  return headers;
}

async function dispatchToEngine(engineUrl, payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ENGINE_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${engineUrl}/analyze`, {
      method: 'POST',
      headers: engineHeaders(),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Analysis engine rejected job: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Analysis engine timeout after ${ENGINE_REQUEST_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function getEnginePool() {
  const raw = process.env.ANALYSIS_SERVICE_URLS || process.env.ANALYSIS_SERVICE_URL || 'http://localhost:8000';
  return raw
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);
}

async function dispatchToEnginePool(payload) {
  const engines = getEnginePool();
  if (engines.length === 0) {
    throw new Error('No analysis engines configured');
  }

  const errors = [];
  const startIndex = nextEngineIndex % engines.length;
  nextEngineIndex = (nextEngineIndex + 1) % engines.length;

  for (let attempt = 0; attempt < engines.length; attempt++) {
    const engineUrl = engines[(startIndex + attempt) % engines.length];
    try {
      await dispatchToEngine(engineUrl, payload);
      return engineUrl;
    } catch (error) {
      errors.push(`${engineUrl}: ${error.message}`);
    }
  }

  throw new Error(`All analysis engines failed: ${errors.join('; ')}`);
}

router.post('/', async (req, res) => {
  try {
    const { username, github_id, display_name, avatar_url } = req.body;

    if (!username || !github_id) {
      return res.status(400).json({ error: 'Missing required fields: username and github_id' });
    }

    // 1. Find existing user — Priority: session > github_id > username
    let user = null;
    
    // Check if the request comes from a logged-in user (session ID from frontend)
    const sessionUserId = req.headers['x-user-id'];
    if (sessionUserId) {
      user = await prisma.user.findUnique({ where: { id: sessionUserId } });
    }

    const finalGithubId = github_id || (user ? user.github_id : null);
    const finalGithubUsername = username || (user ? user.github_username : null);

    if (!finalGithubUsername || !finalGithubId) {
      return res.status(400).json({ error: 'Missing required fields: username and github_id. Please link your GitHub account first.' });
    }

    // Fallback: lookup by github_id
    if (!user) {
      user = await prisma.user.findUnique({ where: { github_id: finalGithubId.toString() } });
    }
    
    // Fallback: lookup by username variants
    if (!user) {
      user = await prisma.user.findFirst({ 
        where: { 
          OR: [
            { github_username: finalGithubUsername },
            { username: finalGithubUsername },
            { codedna_username: finalGithubUsername }
          ]
        } 
      });
    }

    // 2. Update existing or create new user
    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { 
          github_id: finalGithubId.toString(), 
          github_username: finalGithubUsername,
          username: user.username || finalGithubUsername, 
          display_name: user.display_name || display_name, 
          avatar_url: user.avatar_url || avatar_url,
          codedna_username: user.codedna_username || finalGithubUsername
        }
      });
    } else {
      user = await prisma.user.create({
        data: { 
          github_id: finalGithubId.toString(), 
          github_username: finalGithubUsername,
          username: finalGithubUsername, 
          display_name, 
          avatar_url,
          codedna_username: finalGithubUsername
        }
      });
    }

    // 2. Create Analysis Job in DB
    const job = await prisma.analysisJob.create({
      data: {
        user_id: user.id,
        status: 'pending',
        progress: 0,
        current_step: 'Queued for analysis',
      }
    });

    // 3. Fetch and filter GitHub repositories (Rule 3 & 9: exclude learning/hackathon repos)
    let filteredRepos = [];
    try {
      const { access_token } = req.body;
      const tokenToUse = access_token || process.env.GITHUB_TOKEN;
      filteredRepos = await fetchAndFilterRepos(finalGithubUsername, tokenToUse);
      await prisma.analysisJob.update({
        where: { id: job.id },
        data: { current_step: `Found ${filteredRepos.length} eligible repositories`, progress: 10 }
      });
    } catch (githubErr) {
      console.error('GitHub fetch error:', githubErr.message);
      await prisma.analysisJob.update({
        where: { id: job.id },
        data: { current_step: 'Failed to fetch repositories', status: 'failed', error_message: githubErr.message }
      });
      return res.status(502).json({ error: 'Failed to fetch GitHub repositories', jobId: job.id });
    }

    // 4. Fire-and-forget HTTP request to the Python Engine pool
    dispatchToEnginePool({
        jobId: job.id,
        userId: user.id,
        username: user.username,
        repositories: filteredRepos,
        access_token: req.body.access_token || process.env.GITHUB_TOKEN
    }).catch(err => {
      console.error('Python engine unreachable:', err.message);
      prisma.analysisJob.update({
        where: { id: job.id },
        data: { status: 'failed', error_message: err.message }
      }).catch(() => {});
    });

    return res.status(202).json({ message: 'Analysis started', jobId: job.id });

  } catch (error) {
    console.error('Error starting analysis:', error);
    return res.status(500).json({ error: 'Failed to start analysis' });
  }
});

module.exports = router;
module.exports.dispatchToEngine = dispatchToEngine;
module.exports.dispatchToEnginePool = dispatchToEnginePool;
module.exports.getEnginePool = getEnginePool;
