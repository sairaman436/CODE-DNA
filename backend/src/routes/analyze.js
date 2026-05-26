const express = require('express');
const prisma = require('../lib/prisma');
const { fetchAndFilterRepos, checkGatewayRequirements } = require('../services/github');

const router = express.Router();
const ENGINE_REQUEST_TIMEOUT_MS = Number(process.env.ENGINE_REQUEST_TIMEOUT_MS || 5000);
const ANALYSIS_GATEWAY_ENABLED = process.env.CODEDNA_ANALYSIS_GATEWAY_ENABLED !== '0';
const PUBLIC_RATE_WINDOW_MS = Number(process.env.CODEDNA_PUBLIC_ANALYSIS_RATE_WINDOW_MS || 15 * 60 * 1000);
const PUBLIC_RATE_MAX = Number(process.env.CODEDNA_PUBLIC_ANALYSIS_RATE_MAX || 8);
const USER_RATE_WINDOW_MS = Number(process.env.CODEDNA_USER_ANALYSIS_RATE_WINDOW_MS || 2 * 60 * 60 * 1000);
const USER_RATE_MAX = Number(process.env.CODEDNA_USER_ANALYSIS_RATE_MAX || 4);
const rateBuckets = new Map();
let nextEngineIndex = 0;

function clientRateKey(req, githubUsername) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : (forwarded || req.ip || req.socket?.remoteAddress || 'unknown');
  return `${githubUsername || 'anonymous'}:${String(ip).split(',')[0].trim()}`;
}

function checkMemoryRateLimit(key, now = Date.now()) {
  const bucket = rateBuckets.get(key) || [];
  const fresh = bucket.filter((timestamp) => now - timestamp < PUBLIC_RATE_WINDOW_MS);
  if (fresh.length >= PUBLIC_RATE_MAX) {
    const retryAt = fresh[0] + PUBLIC_RATE_WINDOW_MS;
    rateBuckets.set(key, fresh);
    return {
      limited: true,
      retryAfterSeconds: Math.max(1, Math.ceil((retryAt - now) / 1000)),
    };
  }
  fresh.push(now);
  rateBuckets.set(key, fresh);
  return { limited: false, retryAfterSeconds: 0 };
}

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

    let finalGithubId = github_id || (user ? user.github_id : null);
    let finalGithubUsername = username || (user ? user.github_username : null);

    // Fallback: lookup by github_id
    if (!user && finalGithubId) {
      user = await prisma.user.findUnique({ where: { github_id: finalGithubId.toString() } });
    }
    
    // Fallback: lookup by username variants
    if (!user && finalGithubUsername) {
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

    // Resolve actual GitHub credentials from database if user is found
    if (user) {
      if (user.github_username) finalGithubUsername = user.github_username;
      if (user.github_id) finalGithubId = user.github_id;
    }

    if (!finalGithubUsername || !finalGithubId) {
      return res.status(400).json({ error: 'Missing required fields: username and github_id. Please link your GitHub account first.' });
    }

    const memoryLimit = checkMemoryRateLimit(clientRateKey(req, finalGithubUsername));
    if (memoryLimit.limited) {
      res.set('Retry-After', String(memoryLimit.retryAfterSeconds));
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: `Too many analysis attempts from this network. Please try again in ${Math.ceil(memoryLimit.retryAfterSeconds / 60)} minutes.`,
      });
    }

    const { access_token } = req.body;
    const tokenToUse = access_token || (user ? user.github_token : null) || process.env.GITHUB_TOKEN;

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

    // Gateway & Rate Limiting Enforcement
    const isAdmin = user.role === 'ADMIN' || user.email === 'sairamanladi2007@gmail.com' || finalGithubUsername.toLowerCase() === 'sairaman436';
    const isAnalyzingOwnRepos = finalGithubUsername.toLowerCase() === user.github_username?.toLowerCase() ||
                                finalGithubUsername.toLowerCase() === user.username?.toLowerCase() ||
                                finalGithubUsername.toLowerCase() === user.codedna_username?.toLowerCase();

    if (isAnalyzingOwnRepos && !isAdmin) {
      // 1. Rate Limiting Check: 4 analyses in 2 hours
      const twoHoursAgo = new Date(Date.now() - USER_RATE_WINDOW_MS);
      const recentJobsCount = await prisma.analysisJob.count({
        where: {
          user_id: user.id,
          created_at: { gte: twoHoursAgo }
        }
      });

      if (recentJobsCount >= USER_RATE_MAX) {
        const oldestJob = await prisma.analysisJob.findFirst({
          where: {
            user_id: user.id,
            created_at: { gte: twoHoursAgo }
          },
          orderBy: { created_at: 'asc' }
        });

        let remainingMinutes = Math.ceil(USER_RATE_WINDOW_MS / (60 * 1000));
        if (oldestJob && oldestJob.created_at) {
          const diffMs = (oldestJob.created_at.getTime() + USER_RATE_WINDOW_MS) - Date.now();
          remainingMinutes = Math.max(1, Math.ceil(diffMs / (60 * 1000)));
        }

        return res.status(429).json({
          error: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit reached. You can only analyze your repositories ${USER_RATE_MAX} times every ${Math.ceil(USER_RATE_WINDOW_MS / (60 * 60 * 1000))} hours. Please try again in ${remainingMinutes} minutes.`
        });
      }

      // 2. Gateway Check: Star and Follow
      if (ANALYSIS_GATEWAY_ENABLED) {
        const gatewayResult = await checkGatewayRequirements(finalGithubUsername, tokenToUse);

        if (gatewayResult.error) {
          return res.status(400).json({ error: 'GATEWAY_ERROR', message: gatewayResult.error });
        }

        if (!gatewayResult.starred || !gatewayResult.followed) {
          return res.status(403).json({
            error: 'GATEWAY_REQUIRED',
            message: 'To analyze your repositories, you must star the CODE-DNA repository and follow the creator on GitHub.',
            starred: gatewayResult.starred,
            followed: gatewayResult.followed
          });
        }
      }
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
      filteredRepos = await fetchAndFilterRepos(finalGithubUsername, tokenToUse);
      await prisma.analysisJob.update({
        where: { id: job.id },
        data: {
          current_step: `Repository graph mapped: ${filteredRepos.length} production signal sources detected`,
          progress: 10
        }
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
        access_token: tokenToUse
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
module.exports.checkMemoryRateLimit = checkMemoryRateLimit;
module.exports._rateBuckets = rateBuckets;
