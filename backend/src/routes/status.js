const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

// GET /api/status/:jobId — poll for analysis job progress
router.get('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await prisma.analysisJob.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      current_step: job.current_step,
      error_message: job.error_message,
      created_at: job.created_at,
      completed_at: job.completed_at,
    });

  } catch (error) {
    console.error('Error fetching job status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
