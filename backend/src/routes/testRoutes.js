const express = require('express');
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { startSimulation, stopSimulation } = require('../services/simulationService');

const router = express.Router();
router.use(requireAuth);

// Helper to verify user ownership of test
async function getTestForUser(testId, userId) {
  const res = await query(
    `SELECT t.*, m.motor_code, m.name AS motor_name
     FROM motor_tests t
     JOIN motors m ON t.motor_id = m.id
     WHERE t.id = $1 AND t.user_id = $2`,
    [testId, userId]
  );
  return res.rows[0] || null;
}

// POST /api/tests/start - start a new motor test
router.post('/start', async (req, res, next) => {
  try {
    const { motorId, mode = 'simulation', testCondition = 'Normal' } = req.body;

    if (!motorId) {
      return res.status(400).json({ success: false, message: 'Motor ID is required.' });
    }

    if (!['simulation', 'hardware'].includes(mode)) {
      return res.status(400).json({ success: false, message: 'Mode must be simulation or hardware.' });
    }

    // Verify motor ownership
    const motorRes = await query(
      'SELECT id, motor_code, name FROM motors WHERE id = $1 AND created_by = $2',
      [motorId, req.user.id]
    );

    if (motorRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Motor not found or unauthorized.' });
    }

    // Stop any previously running tests for this motor by this user
    const runningTests = await query(
      "SELECT id FROM motor_tests WHERE motor_id = $1 AND status = 'running'",
      [motorId]
    );
    for (const row of runningTests.rows) {
      stopSimulation(row.id);
      await query("UPDATE motor_tests SET status = 'stopped' WHERE id = $1", [row.id]);
    }

    // Insert new test record
    const insertRes = await query(
      `INSERT INTO motor_tests (user_id, motor_id, mode, test_condition, status, started_at)
       VALUES ($1, $2, $3, $4, 'running', CURRENT_TIMESTAMP)
       RETURNING *`,
      [req.user.id, motorId, mode, testCondition]
    );

    const test = insertRes.rows[0];
    const io = req.app.get('io');

    if (mode === 'simulation') {
      startSimulation(test.id, motorId, req.user.id, testCondition, io);
    }

    res.status(201).json({
      success: true,
      test: {
        ...test,
        motor_code: motorRes.rows[0].motor_code,
        motor_name: motorRes.rows[0].name,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/tests/:id/stop - stop active test
router.post('/:id/stop', async (req, res, next) => {
  try {
    const testId = parseInt(req.params.id, 10);
    const test = await getTestForUser(testId, req.user.id);

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found or unauthorized.' });
    }

    stopSimulation(testId);

    const updateRes = await query(
      `UPDATE motor_tests 
       SET status = 'stopped' 
       WHERE id = $1 
       RETURNING *`,
      [testId]
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`test_${testId}`).emit('test_status_change', { testId, status: 'stopped' });
    }

    res.json({
      success: true,
      test: { ...updateRes.rows[0], motor_code: test.motor_code, motor_name: test.motor_name },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/tests/:id/finish - finish and finalize test
router.post('/:id/finish', async (req, res, next) => {
  try {
    const testId = parseInt(req.params.id, 10);
    const test = await getTestForUser(testId, req.user.id);

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found or unauthorized.' });
    }

    stopSimulation(testId);

    // Compute final summary from telemetry
    const statsRes = await query(
      `SELECT 
         COUNT(*) as reading_count,
         COALESCE(AVG(vibration), 0) as avg_vib,
         COALESCE(MAX(vibration), 0) as max_vib,
         COALESCE(AVG(temperature), 0) as avg_temp,
         COALESCE(MAX(temperature), 0) as max_temp
       FROM telemetry
       WHERE test_id = $1`,
      [testId]
    );

    const s = statsRes.rows[0];
    const readingCount = parseInt(s.reading_count, 10);
    const avgVib = Math.round(parseFloat(s.avg_vib) * 100) / 100;
    const maxVib = Math.round(parseFloat(s.max_vib) * 100) / 100;
    const avgTemp = Math.round(parseFloat(s.avg_temp) * 10) / 10;
    const maxTemp = Math.round(parseFloat(s.max_temp) * 10) / 10;

    const startedTime = new Date(test.started_at).getTime();
    const durationSeconds = Math.max(test.duration_seconds || 1, Math.round((Date.now() - startedTime) / 1000));

    const updateRes = await query(
      `UPDATE motor_tests
       SET status = 'completed',
           finished_at = CURRENT_TIMESTAMP,
           duration_seconds = $1,
           reading_count = $2,
           average_vibration = $3,
           maximum_vibration = $4,
           average_temperature = $5,
           maximum_temperature = $6
       WHERE id = $7
       RETURNING *`,
      [durationSeconds, readingCount, avgVib, maxVib, avgTemp, maxTemp, testId]
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`test_${testId}`).emit('test_status_change', { testId, status: 'completed' });
    }

    res.json({
      success: true,
      test: { ...updateRes.rows[0], motor_code: test.motor_code, motor_name: test.motor_name },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/tests - list all historical tests for user with optional filters
router.get('/', async (req, res, next) => {
  try {
    const { motorId, status, mode, condition, search, dateFrom, dateTo } = req.query;

    let sql = `
      SELECT t.*, m.motor_code, m.name AS motor_name
      FROM motor_tests t
      JOIN motors m ON t.motor_id = m.id
      WHERE t.user_id = $1
    `;
    const params = [req.user.id];
    let paramIndex = 2;

    if (motorId) {
      sql += ` AND t.motor_id = $${paramIndex++}`;
      params.push(motorId);
    }
    if (status) {
      sql += ` AND t.status = $${paramIndex++}`;
      params.push(status);
    }
    if (mode) {
      sql += ` AND t.mode = $${paramIndex++}`;
      params.push(mode);
    }
    if (condition) {
      sql += ` AND t.test_condition = $${paramIndex++}`;
      params.push(condition);
    }
    if (dateFrom) {
      sql += ` AND t.started_at >= $${paramIndex++}::timestamp`;
      params.push(dateFrom);
    }
    if (dateTo) {
      sql += ` AND t.started_at <= $${paramIndex++}::timestamp + INTERVAL '1 day'`;
      params.push(dateTo);
    }
    if (search) {
      sql += ` AND (m.motor_code ILIKE $${paramIndex} OR m.name ILIKE $${paramIndex} OR t.possible_fault ILIKE $${paramIndex})`;
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    sql += ' ORDER BY t.started_at DESC, t.id DESC';

    const listRes = await query(sql, params);
    res.json({
      success: true,
      totalCount: listRes.rows.length,
      tests: listRes.rows,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/tests/compare?firstId=1&secondId=2
router.get('/compare', async (req, res, next) => {
  try {
    const firstId = parseInt(req.query.firstId, 10);
    const secondId = parseInt(req.query.secondId, 10);

    if (isNaN(firstId) || isNaN(secondId)) {
      return res.status(400).json({
        success: false,
        message: 'Both firstId and secondId query parameters are required.',
      });
    }

    const test1 = await getTestForUser(firstId, req.user.id);
    const test2 = await getTestForUser(secondId, req.user.id);

    if (!test1 || !test2) {
      return res.status(404).json({
        success: false,
        message: 'One or both tests were not found or unauthorized.',
      });
    }

    // Numerical differences (test2 - test1)
    const score1 = parseFloat(test1.health_score) || 0;
    const score2 = parseFloat(test2.health_score) || 0;
    const vib1 = parseFloat(test1.average_vibration) || 0;
    const vib2 = parseFloat(test2.average_vibration) || 0;
    const temp1 = parseFloat(test1.average_temperature) || 0;
    const temp2 = parseFloat(test2.average_temperature) || 0;
    const maxVib1 = parseFloat(test1.maximum_vibration) || 0;
    const maxVib2 = parseFloat(test2.maximum_vibration) || 0;

    const deltaScore = Math.round((score2 - score1) * 10) / 10;
    const deltaAvgVib = Math.round((vib2 - vib1) * 100) / 100;
    const deltaMaxVib = Math.round((maxVib2 - maxVib1) * 100) / 100;
    const deltaAvgTemp = Math.round((temp2 - temp1) * 10) / 10;

    // Rule-based conclusion: Improving, Stable, Deteriorating
    let conclusion = 'Stable';
    let reason = 'Motor metrics are consistent between both test evaluations.';

    if (deltaScore >= 5 || (deltaAvgVib <= -0.5 && deltaScore >= 0)) {
      conclusion = 'Improving';
      reason = `Health score improved by ${Math.abs(deltaScore)} points with reduced vibration profile.`;
    } else if (deltaScore <= -5 || deltaAvgVib >= 0.8 || deltaMaxVib >= 1.5) {
      conclusion = 'Deteriorating';
      reason = `Health score dropped by ${Math.abs(deltaScore)} points with elevated vibration levels.`;
    }

    res.json({
      success: true,
      firstTest: test1,
      secondTest: test2,
      comparison: {
        deltaScore,
        deltaAvgVib,
        deltaMaxVib,
        deltaAvgTemp,
        conclusion,
        reason,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/tests/:id - get single test
router.get('/:id', async (req, res, next) => {
  try {
    const testId = parseInt(req.params.id, 10);
    const test = await getTestForUser(testId, req.user.id);

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found or unauthorized.' });
    }

    res.json({
      success: true,
      test,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/tests/:id/telemetry - get full telemetry series
router.get('/:id/telemetry', async (req, res, next) => {
  try {
    const testId = parseInt(req.params.id, 10);
    const test = await getTestForUser(testId, req.user.id);

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found or unauthorized.' });
    }

    const telemetryRes = await query(
      `SELECT id, vibration, temperature, timestamp, source
       FROM telemetry
       WHERE test_id = $1
       ORDER BY timestamp ASC
       LIMIT 1000`,
      [testId]
    );

    res.json({
      success: true,
      telemetry: telemetryRes.rows,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
