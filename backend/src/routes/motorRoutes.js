const express = require('express');
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/motors - list all motors owned by user
router.get('/', async (req, res, next) => {
  try {
    const motorsRes = await query(
      `SELECT m.*, 
              COUNT(t.id) AS total_tests,
              (
                SELECT health_status 
                FROM motor_tests 
                WHERE motor_id = m.id 
                ORDER BY started_at DESC 
                LIMIT 1
              ) AS latest_status,
              (
                SELECT health_score 
                FROM motor_tests 
                WHERE motor_id = m.id 
                ORDER BY started_at DESC 
                LIMIT 1
              ) AS latest_health_score
       FROM motors m
       LEFT JOIN motor_tests t ON m.id = t.motor_id
       WHERE m.created_by = $1
       GROUP BY m.id
       ORDER BY m.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      motors: motorsRes.rows,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/motors - register a new motor
router.post('/', async (req, res, next) => {
  try {
    const { motor_code, name, description } = req.body;

    if (!motor_code || !name) {
      return res.status(400).json({
        success: false,
        message: 'Motor code and name are required.',
      });
    }

    const code = motor_code.trim().toUpperCase();

    // Check duplicate code for this user
    const existing = await query(
      'SELECT id FROM motors WHERE created_by = $1 AND motor_code = $2',
      [req.user.id, code]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Motor with code ${code} already exists in your workspace.`,
      });
    }

    const insertRes = await query(
      `INSERT INTO motors (motor_code, name, description, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [code, name.trim(), (description || '').trim(), req.user.id]
    );

    res.status(201).json({
      success: true,
      motor: insertRes.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/motors/:id - get single motor
router.get('/:id', async (req, res, next) => {
  try {
    const motorId = parseInt(req.params.id, 10);
    if (isNaN(motorId)) {
      return res.status(400).json({ success: false, message: 'Invalid motor ID.' });
    }

    const motorRes = await query(
      `SELECT m.*, COUNT(t.id) AS total_tests
       FROM motors m
       LEFT JOIN motor_tests t ON m.id = t.motor_id
       WHERE m.id = $1 AND m.created_by = $2
       GROUP BY m.id`,
      [motorId, req.user.id]
    );

    if (motorRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Motor not found.' });
    }

    res.json({
      success: true,
      motor: motorRes.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
