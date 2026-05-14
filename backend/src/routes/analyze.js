const express = require('express');
const prisma = require('../lib/prisma');
const { fetchAndFilterRepos } = require('../services/github');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { username, github_id, display_name, avatar_url } = req.body;

    if (!username || !github_id) {
      return res.status(400).json({ error: 'Missing required fields: username and github_id' });
    }

    // 1. Create or Update User in DB
    const user = await prisma.user.upsert({
      where: { github_id: github_id.toString() },
      update: { username, display_name, avatar_url },
      create: { github_id: github_id.toString(), username, display_name, avatar_url }
    });

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
      filteredRepos = await fetchAndFilterRepos(username, tokenToUse);
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

    // 4. Fire-and-forget HTTP request to the Python Engine
    const engineUrl = process.env.ANALYSIS_SERVICE_URL || 'http://localhost:8000';
    fetch(`${engineUrl}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: job.id,
        userId: user.id,
        username: user.username,
        repositories: filteredRepos,
        access_token: req.body.access_token || process.env.GITHUB_TOKEN
      })
    }).catch(err => {
      console.error('Python engine unreachable:', err.message);
      prisma.analysisJob.update({
        where: { id: job.id },
        data: { status: 'failed', error_message: 'Analysis engine unreachable' }
      }).catch(() => {});
    });

    return res.status(202).json({ message: 'Analysis started', jobId: job.id });

  } catch (error) {
    console.error('Error starting analysis:', error);
    return res.status(500).json({ error: 'Failed to start analysis' });
  }
});

module.exports = router;
