const http = require('http');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const config = require('./config/env');
const { pool, query } = require('./db/pool');
const { initMQTT } = require('./services/mqttService');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const motorRoutes = require('./routes/motorRoutes');
const testRoutes = require('./routes/testRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const server = http.createServer(app);

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: [config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  },
});

app.set('io', io);

// Socket Authentication Middleware
io.use((socket, next) => {
  try {
    let token = null;
    const cookieHeader = socket.handshake.headers.cookie;

    if (cookieHeader) {
      const match = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('motorvibe_token='));
      if (match) {
        token = match.split('=')[1];
      }
    }

    if (!token && socket.handshake.auth && socket.handshake.auth.token) {
      token = socket.handshake.auth.token;
    }

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Invalid socket credentials'));
  }
});

io.on('connection', (socket) => {
  socket.join(`user_${socket.userId}`);

  socket.on('join_test', (testId) => {
    socket.join(`test_${testId}`);
  });

  socket.on('leave_test', (testId) => {
    socket.leave(`test_${testId}`);
  });
});

// Express Middlewares
app.use(cors({
  origin: [config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/motors', motorRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/hardware', dashboardRoutes);

// Health Endpoint
app.get('/api/health', async (_req, res) => {
  try {
    const dbTest = await query('SELECT 1 as alive');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbTest.rows.length > 0 ? 'connected' : 'unresponsive',
      environment: config.nodeEnv,
    });
  } catch (err) {
    console.error('PostgreSQL health check failed:', err.code || 'unknown database error');
    res.status(503).json({
      status: 'unhealthy',
      database: 'error',
    });
  }
});

app.use(errorHandler);

// Initialize MQTT Telemetry Service
initMQTT(io);

// Server startup if executed directly
if (require.main === module) {
  server.listen(config.port, () => {
    console.log(`=======================================================`);
    console.log(` MotorVibe Industrial Telemetry Server running on port ${config.port}`);
    console.log(` Environment: ${config.nodeEnv}`);
    console.log(` Frontend URL: ${config.frontendUrl}`);
    console.log(`=======================================================`);

    query("SELECT to_regclass('public.users') AS users_table")
      .then((result) => {
        if (result.rows[0].users_table) {
          console.log('PostgreSQL connection and MotorVibe schema verified.');
        } else {
          console.error('PostgreSQL is connected but the MotorVibe schema is missing. Run npm run db:init.');
        }
      })
      .catch((err) => {
        console.error(
          'PostgreSQL is unavailable. Check that the service is running, DATABASE_URL is correct, and the database exists.',
          err.code ? `(database error ${err.code})` : ''
        );
      });
  });
}

module.exports = { app, server, io };
