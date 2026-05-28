const express = require('express');
const crypto = require('crypto');
const prisma = require('../lib/prisma');

const router = express.Router();
const SCORE_KEYS = [
  'readability',
  'complexity',
  'documentation',
  'test_mindset',
  'commit_discipline',
  'language_depth',
  'refactor_tendency',
  'error_handling',
];

function verifyWebhookSecret(req, res, next) {
  const expected = process.env.WEBHOOK_SECRET;
  if (!expected) return next();

  const received = req.headers['x-webhook-secret'];
  if (typeof received !== 'string') {
    return res.status(401).json({ error: 'Unauthorized webhook' });
  }

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
    return res.status(401).json({ error: 'Unauthorized webhook' });
  }

  return next();
}

function hasValidScores(results) {
  return !!results?.scores && SCORE_KEYS.every((key) => Number.isFinite(results.scores[key]));
}

router.use(verifyWebhookSecret);

// Python engine calls this endpoint when analysis is complete
router.post('/results', async (req, res) => {
  try {
    const { jobId, userId, results } = req.body;

    if (!jobId || !userId || !results) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!hasValidScores(results)) {
      return res.status(400).json({ error: 'Invalid analysis scores' });
    }

    // 1. Update the analysis job to completed
    await prisma.analysisJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        progress: 100,
        current_step: 'Analysis complete',
        completed_at: new Date()
      }
    });

    // 2. Save the Fingerprint
    const fingerprint = await prisma.fingerprint.create({
      data: {
        user_id: userId,
        readability_score: results.scores.readability,
        complexity_score: results.scores.complexity,
        documentation_score: results.scores.documentation,
        test_mindset_score: results.scores.test_mindset,
        commit_discipline_score: results.scores.commit_discipline,
        language_depth_score: results.scores.language_depth,
        refactor_tendency_score: results.scores.refactor_tendency,
        error_handling_score: results.scores.error_handling,
        developer_type: results.developer_type,
        personality_summary: results.personality_summary,
        strengths: JSON.stringify(results.strengths || []),
        growth_areas: JSON.stringify(results.growth_areas || []),
        repos_analyzed: results.repos_analyzed || 0,
        total_files_analyzed: results.total_files_analyzed || 0,
        activity_pulse: JSON.stringify(results.activity_pulse || []),
      }
    });

    // 3. Save language stats if provided
    if (results.language_stats && Array.isArray(results.language_stats)) {
      for (const lang of results.language_stats) {
        await prisma.languageStat.create({
          data: {
            fingerprint_id: fingerprint.id,
            language: lang.language,
            total_lines: lang.total_lines || 0,
            total_commits: lang.total_commits || 0,
            trend: lang.trend || 'stable',
          }
        });
      }
    }

    // 4. Save commit patterns if provided
    if (results.commit_patterns) {
      await prisma.commitPattern.create({
        data: {
          fingerprint_id: fingerprint.id,
          avg_message_length: results.commit_patterns.avg_message_length,
          commit_style: results.commit_patterns.commit_style,
          most_active_hour: results.commit_patterns.most_active_hour,
          most_active_day: results.commit_patterns.most_active_day,
          avg_commit_size: results.commit_patterns.avg_commit_size,
          fix_to_feature_ratio: results.commit_patterns.fix_to_feature_ratio,
          emoji_usage_pct: results.commit_patterns.emoji_usage_pct,
          naming_style: results.commit_patterns.naming_style,
          avg_fn_length: results.commit_patterns.avg_fn_length,
          total_commits: results.commit_patterns.total_commits,
        }
      });
    }

    // 5. Update the User's last analyzed date
    await prisma.user.update({
      where: { id: userId },
      data: { last_analyzed_at: new Date() }
    });

    // 6. Save Vector Embedding for similarity search
    const embeddingArray = [
      results.scores.readability, results.scores.complexity,
      results.scores.documentation, results.scores.test_mindset,
      results.scores.commit_discipline, results.scores.language_depth,
      results.scores.refactor_tendency, results.scores.error_handling
    ];

    // Upsert vector — replace old one if exists
    const existingVector = await prisma.developerVector.findFirst({ where: { user_id: userId } });
    if (existingVector) {
      await prisma.developerVector.update({
        where: { id: existingVector.id },
        data: { embedding: JSON.stringify(embeddingArray), updated_at: new Date() }
      });
    } else {
      await prisma.developerVector.create({
        data: { user_id: userId, embedding: JSON.stringify(embeddingArray) }
      });
    }

    console.log(`✅ Analysis results saved for user ${userId} (fingerprint: ${fingerprint.id})`);

    // Log the successful completion of the analysis
    await prisma.activityLog.create({
      data: {
        user_id: userId,
        action: 'ANALYSIS_COMPLETE',
        details: `Successfully completed repository analysis (Archetype: ${results.developer_type})`
      }
    }).catch(err => console.error('Failed to log analysis success:', err.message));

    return res.status(200).json({ message: 'Results saved successfully', fingerprintId: fingerprint.id });

  } catch (error) {
    console.error('Webhook Error:', error);

    if (req.body?.jobId) {
      await prisma.analysisJob.update({
        where: { id: req.body.jobId },
        data: { status: 'failed', error_message: error.message }
      }).catch(e => console.error('Failed to update job status:', e));
    }

    if (req.body?.userId) {
      await prisma.activityLog.create({
        data: {
          user_id: req.body.userId,
          action: 'ANALYSIS_FAIL',
          details: `Analysis processing failed: ${error.message}`
        }
      }).catch(() => {});
    }

    return res.status(500).json({ error: 'Failed to process results' });
  }
});

// Python engine calls this to update progress during long tasks
router.post('/progress', async (req, res) => {
  try {
    const { jobId, progress, step } = req.body;
    if (!jobId) return res.status(400).json({ error: 'Missing jobId' });

    await prisma.analysisJob.update({
      where: { id: jobId },
      data: { 
        progress: progress !== undefined ? progress : undefined,
        current_step: step || undefined
      }
    });

    return res.status(200).json({ message: 'Progress updated' });
  } catch (error) {
    console.error('Progress Webhook Error:', error);
    return res.status(500).json({ error: 'Failed to update progress' });
  }
});

module.exports = router;
