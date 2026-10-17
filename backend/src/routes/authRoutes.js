const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function createToken(userId) {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '7d' });
}

function setAuthCookie(res, token) {
  res.cookie('motorvibe_token', token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSecure ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

function validateRegistration({ name, username, email, password }) {
  if (![name, username, email, password].every((value) => typeof value === 'string' && value.trim())) {
    return 'All fields are required.';
  }
  if (name.trim().length > 100) return 'Name must be 100 characters or fewer.';
  if (!/^[a-zA-Z0-9_.-]{3,50}$/.test(username.trim())) {
    return 'Username must be 3-50 characters and use only letters, numbers, dots, underscores, or hyphens.';
  }
  if (email.trim().length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'Please enter a valid email address.';
  }
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return null;
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, username, email, password, confirmPassword } = req.body || {};

    const validationError = validateRegistration({ name, username, email, password });
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check unique username
    const existingUser = await query(
      'SELECT id FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $2',
      [cleanUsername, cleanEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username or email is already registered.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const insertRes = await query(
      `INSERT INTO users (name, username, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, username, email, created_at`,
      [name.trim(), cleanUsername, cleanEmail, passwordHash]
    );

    const newUser = insertRes.rows[0];
    const token = createToken(newUser.id);
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      user: newUser,
      token,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { identifier, password } = req.body || {};

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/email and password are required.',
      });
    }

    const cleanId = identifier.trim().toLowerCase();
    const userRes = await query(
      'SELECT * FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $1',
      [cleanId]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login credentials.',
      });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login credentials.',
      });
    }

    const token = createToken(user.id);
    setAuthCookie(res, token);

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        createdAt: user.created_at,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('motorvibe_token', { path: '/' });
  res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

module.exports = router;
