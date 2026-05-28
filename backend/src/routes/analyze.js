const express = require('express');
const prisma = require('../lib/prisma');
const { fetchAndFilterRepos, checkGatewayRequirements } = require('../services/github');

const router = express.Router();
const ENGINE_REQUEST_TIMEOUT_MS = Number(process.env.ENGINE_REQUEST_TIMEOUT_MS || 60000);
const ANALYSIS_GATEWAY_ENABLED = process.env.CODEDNA_ANALYSIS_GATEWAY_ENABLED !== '0';
const PUBLIC_RATE_WINDOW_MS = Number(process.env.CODEDNA_PUBLIC_ANALYSIS_RATE_WINDOW_MS || 15 * 60 * 1000);
const PUBLIC_RATE_MAX = Number(process.env.CODEDNA_PUBLIC_ANALYSIS_RATE_MAX || 8);
const USER_RATE_WINDOW_MS = Number(process.env.CODEDNA_USER_ANALYSIS_RATE_WINDOW_MS || 1 * 60 * 60 * 1000);
const USER_RATE_MAX = Number(process.env.CODEDNA_USER_ANALYSIS_RATE_MAX || 6);
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

function isPrivilegedAnalysisUser(user, githubUsername) {
  const role = user?.role;
  return role === 'ADMIN' ||
    role === 'STAFF' ||
    user?.email === 'sairamanladi2007@gmail.com' ||
    githubUsername?.toLowerCase() === 'sairaman436';
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

    if (!username) {
      return res.status(400).json({ error: 'GitHub username is required.' });
    }

    // First check if the username is a local Code DNA profile name, and resolve it to their GitHub username if linked
    const resolvedUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { codedna_username: username }
        ]
      }
    });

    let finalGithubUsername = (resolvedUser && resolvedUser.github_username) ? resolvedUser.github_username : username;
    let finalGithubId = github_id || (resolvedUser && resolvedUser.github_id) || null;
    let finalDisplayName = display_name;
    let finalAvatarUrl = avatar_url;

    // Enforce profile ownership verification:
    // If a requester ID is supplied, check if they are an ADMIN (which bypasses checks).
    const requesterId = req.headers['x-user-id'];
    let isAdmin = false;
    if (requesterId) {
      const requester = await prisma.user.findUnique({ where: { id: requesterId } });
      if (requester && requester.role === 'ADMIN') {
        isAdmin = true;
      }
    }

    // If github_id is missing, look it up via GitHub's public API
    if (!finalGithubId) {
      try {
        console.log(`🔍 Looking up GitHub user profile for @${finalGithubUsername} publicly...`);
        const userRes = await fetch(`https://api.github.com/users/${finalGithubUsername}`, {
          headers: {
            'User-Agent': 'CodeDNA-App/1.0',
            ...(process.env.GITHUB_TOKEN ? { 'Authorization': `token ${process.env.GITHUB_TOKEN}` } : {})
          }
        });
        if (!userRes.ok) {
          if (userRes.status === 404) {
            return res.status(404).json({ error: `GitHub user @${finalGithubUsername} not found.` });
          }
          throw new Error(`GitHub API returned status ${userRes.status}`);
        }
        const githubUser = await userRes.json();
        finalGithubId = githubUser.id?.toString();
        finalDisplayName = githubUser.name || githubUser.login;
        finalAvatarUrl = githubUser.avatar_url;
      } catch (err) {
        console.error('Error fetching GitHub user profile:', err.message);
        return res.status(500).json({ error: `Could not verify GitHub username: ${err.message}` });
      }
    }

    // 1. Find existing target user in the database (Priority: github_id > username)
    let user = null;
    
    // Lookup by github_id first
    if (finalGithubId) {
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

    const isPrivilegedBeforeUserWrite = isPrivilegedAnalysisUser(user, finalGithubUsername);
    if (!isPrivilegedBeforeUserWrite) {
      const memoryLimit = checkMemoryRateLimit(clientRateKey(req, finalGithubUsername));
      if (memoryLimit.limited) {
        res.set('Retry-After', String(memoryLimit.retryAfterSeconds));
        return res.status(429).json({
          error: 'RATE_LIMIT_EXCEEDED',
          message: `Too many analysis attempts from this network. Please try again in ${Math.ceil(memoryLimit.retryAfterSeconds / 60)} minutes.`,
        });
      }
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
          display_name: user.display_name || finalDisplayName, 
          avatar_url: user.avatar_url || finalAvatarUrl,
          codedna_username: user.codedna_username || finalGithubUsername
        }
      });
    } else {
      user = await prisma.user.create({
        data: { 
          github_id: finalGithubId.toString(), 
          github_username: finalGithubUsername,
          username: finalGithubUsername, 
          display_name: finalDisplayName, 
          avatar_url: finalAvatarUrl,
          codedna_username: finalGithubUsername
        }
      });
    }

    // Gateway & Rate Limiting Enforcement
    const isPrivileged = isPrivilegedAnalysisUser(user, finalGithubUsername);
    const isAnalyzingOwnRepos = finalGithubUsername.toLowerCase() === user.github_username?.toLowerCase() ||
                                finalGithubUsername.toLowerCase() === user.username?.toLowerCase() ||
                                finalGithubUsername.toLowerCase() === user.codedna_username?.toLowerCase();

    if (isAnalyzingOwnRepos && !isPrivileged) {
      // 1. Rate Limiting Check: 4 analyses in 2 hours
      const windowStart = new Date(Date.now() - USER_RATE_WINDOW_MS);
      const recentJobsCount = await prisma.analysisJob.count({
        where: {
          user_id: user.id,
          created_at: { gte: windowStart }
        }
      });

      if (recentJobsCount >= USER_RATE_MAX) {
        const oldestJob = await prisma.analysisJob.findFirst({
          where: {
            user_id: user.id,
            created_at: { gte: windowStart }
          },
          orderBy: { created_at: 'asc' }
        });

        let remainingMinutes = Math.ceil(USER_RATE_WINDOW_MS / (60 * 1000));
        if (oldestJob && oldestJob.created_at) {
          const diffMs = (oldestJob.created_at.getTime() + USER_RATE_WINDOW_MS) - Date.now();
          remainingMinutes = Math.max(1, Math.ceil(diffMs / (60 * 1000)));
        }

        const windowHours = Math.ceil(USER_RATE_WINDOW_MS / (60 * 60 * 1000));
        const hourUnit = windowHours === 1 ? 'hour' : 'hours';

        return res.status(429).json({
          error: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit reached. You can only analyze your repositories ${USER_RATE_MAX} times every ${windowHours} ${hourUnit}. Please try again in ${remainingMinutes} minutes.`
        });
      }

      // 2. Gateway Check: Star only (Follow optional/bypassed)
      if (ANALYSIS_GATEWAY_ENABLED) {
        const isSystemToken = tokenToUse === process.env.GITHUB_TOKEN;
        const gatewayResult = await checkGatewayRequirements(
          finalGithubUsername,
          isSystemToken ? null : tokenToUse
        );

        if (gatewayResult.error) {
          return res.status(400).json({ error: 'GATEWAY_ERROR', message: gatewayResult.error });
        }

        if (!gatewayResult.starred) {
          return res.status(403).json({
            error: 'GATEWAY_REQUIRED',
            message: 'To analyze your repositories, you must star the CODE-DNA repository on GitHub.',
            starred: gatewayResult.starred,
            followed: true // Bypassed
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

    // Log the start of the analysis
    await prisma.activityLog.create({
      data: {
        user_id: user.id,
        action: 'ANALYSIS_START',
        details: `Started repository analysis for @${finalGithubUsername}`
      }
    }).catch(err => console.error('Failed to log analysis start:', err.message));
 
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
      await prisma.activityLog.create({
        data: {
          user_id: user.id,
          action: 'ANALYSIS_FAIL',
          details: `Failed to fetch repositories for @${finalGithubUsername}: ${githubErr.message}`
        }
      }).catch(() => {});
      await prisma.analysisJob.update({
        where: { id: job.id },
        data: { current_step: 'Failed to fetch repositories', status: 'failed', error_message: githubErr.message }
      });
      return res.status(502).json({ error: `Failed to fetch GitHub repositories: ${githubErr.message}`, jobId: job.id });
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
module.exports.isPrivilegedAnalysisUser = isPrivilegedAnalysisUser;
module.exports._rateBuckets = rateBuckets;
