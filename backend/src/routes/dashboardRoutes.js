const express = require('express');
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { getHardwareStatus } = require('../services/mqttService');

const router = express.Router();
router.use(requireAuth);

// GET /api/dashboard/summary - complete dashboard metrics
router.get('/summary', async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Motor counts
    const motorCountRes = await query(
      'SELECT COUNT(*)::int AS count FROM motors WHERE created_by = $1',
      [userId]
    );
    const totalMotors = motorCountRes.rows[0].count;

    // 2. Test status counts
    const statusCountsRes = await query(
      `SELECT 
         COUNT(*)::int AS total_tests,
         COUNT(CASE WHEN health_status = 'Healthy' THEN 1 END)::int AS healthy_count,
         COUNT(CASE WHEN health_status = 'Warning' THEN 1 END)::int AS warning_count,
         COUNT(CASE WHEN health_status = 'Critical' THEN 1 END)::int AS critical_count
       FROM motor_tests
       WHERE user_id = $1`,
      [userId]
    );
    const stats = statusCountsRes.rows[0];

    // 3. Latest test
    const latestTestRes = await query(
      `SELECT t.*, m.motor_code, m.name AS motor_name
       FROM motor_tests t
       JOIN motors m ON t.motor_id = m.id
       WHERE t.user_id = $1
       ORDER BY t.started_at DESC
       LIMIT 1`,
      [userId]
    );
    const latestTest = latestTestRes.rows[0] || null;

    // 4. Latest telemetry reading
    let latestTelemetry = null;
    if (latestTest) {
      const telRes = await query(
        `SELECT vibration, temperature, timestamp, source
         FROM telemetry
         WHERE test_id = $1
         ORDER BY timestamp DESC
         LIMIT 1`,
        [latestTest.id]
      );
      latestTelemetry = telRes.rows[0] || null;
    }

    // 5. Recent tests (last 5)
    const recentTestsRes = await query(
      `SELECT t.*, m.motor_code, m.name AS motor_name
       FROM motor_tests t
       JOIN motors m ON t.motor_id = m.id
       WHERE t.user_id = $1
       ORDER BY t.started_at DESC
       LIMIT 5`,
      [userId]
    );

    // 6. Recent alerts
    const recentAlertsRes = await query(
      `SELECT t.id, t.health_status, t.possible_fault, t.priority, t.started_at,
              m.motor_code, m.name as motor_name
       FROM motor_tests t
       JOIN motors m ON t.motor_id = m.id
       WHERE t.user_id = $1 AND t.health_status IN ('Warning', 'Critical')
       ORDER BY t.started_at DESC
       LIMIT 5`,
      [userId]
    );

    // 7. Trend data (recent 10 completed/active tests)
    const trendRes = await query(
      `SELECT t.id, t.started_at, t.health_score, t.average_vibration, t.average_temperature, m.motor_code
       FROM motor_tests t
       JOIN motors m ON t.motor_id = m.id
       WHERE t.user_id = $1
       ORDER BY t.started_at ASC
       LIMIT 15`,
      [userId]
    );

    res.json({
      success: true,
      summary: {
        totalMotors,
        totalTests: stats.total_tests || 0,
        healthyCount: stats.healthy_count || 0,
        warningCount: stats.warning_count || 0,
        criticalCount: stats.critical_count || 0,
        latestTest,
        latestTelemetry,
        recentTests: recentTestsRes.rows,
        recentAlerts: recentAlertsRes.rows,
        trends: trendRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/hardware/status - MQTT and hardware status
router.get('/hardware/status', async (req, res, next) => {
  try {
    let motorCode = null;
    if (req.query.motorId) {
      const motorId = parseInt(req.query.motorId, 10);
      const mRes = await query(
        'SELECT motor_code FROM motors WHERE id = $1 AND created_by = $2',
        [motorId, req.user.id]
      );
      if (mRes.rows.length > 0) {
        motorCode = mRes.rows[0].motor_code;
      }
    }

    const status = getHardwareStatus(motorCode);
    res.json({
      success: true,
      status,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
