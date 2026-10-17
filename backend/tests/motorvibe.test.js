const request = require('supertest');
const { app, server } = require('../src/server');
const { pool, query } = require('../src/db/pool');
const { analyzeMotorHealth, calculateVibrationPenalty, calculateTemperaturePenalty } = require('../src/services/healthAnalysis');
const { validateTelemetryPayload, closeMQTT } = require('../src/services/mqttService');

describe('MotorVibe Full System Tests', () => {
  let authCookie = null;
  let authToken = null;
  let testUserId = null;
  let testMotorId = null;
  let testRunId = null;

  const testUser = {
    name: 'Industrial Test Engineer',
    username: `tester_${Date.now()}`,
    email: `tester_${Date.now()}@motorvibe.internal`,
    password: 'SecurePassword123!',
    confirmPassword: 'SecurePassword123!',
  };

  afterAll(async () => {
    closeMQTT();
    // Cleanup created test records
    if (testUserId) {
      await query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    await pool.end();
    await new Promise((resolve) => server.close(resolve));
  });

  describe('1. Health Analysis Algorithm & Thresholds', () => {
    test('Calculates zero penalties for nominal conditions', () => {
      const vibPen = calculateVibrationPenalty(1.5);
      const tempPen = calculateTemperaturePenalty(40.0);
      expect(vibPen).toBe(0);
      expect(tempPen).toBe(0);

      const res = analyzeMotorHealth(1.5, 40.0);
      expect(res.healthScore).toBe(100);
      expect(res.healthStatus).toBe('Healthy');
      expect(res.possibleFault).toBe('No Major Issue Detected');
      expect(res.priority).toBe('Low');
    });

    test('Identifies Overheating condition with high temperature', () => {
      const res = analyzeMotorHealth(2.0, 82.0);
      expect(res.healthScore).toBeLessThan(75);
      expect(res.healthStatus).toMatch(/Warning|Critical/);
      expect(res.possibleFault).toBe('Possible Overheating');
      expect(res.recommendation).toBe('Inspect cooling and ventilation.');
    });

    test('Identifies Bearing Fault when vibration and temperature are both elevated', () => {
      const res = analyzeMotorHealth(5.2, 78.0);
      expect(res.healthStatus).toBe('Critical');
      expect(res.possibleFault).toBe('Possible Bearing Problem');
      expect(res.priority).toBe('High');
      expect(res.recommendation).toBe('Inspect bearing condition and lubrication.');
    });

    test('Identifies Loose Mounting on severe vibration spike', () => {
      const res = analyzeMotorHealth(7.8, 42.0, { recentSpike: true });
      expect(res.possibleFault).toBe('Possible Loose Mounting');
      expect(res.recommendation).toBe('Inspect mounting bolts and foundation.');
    });
  });

  describe('2. MQTT Telemetry Payload Validation', () => {
    test('Validates compliant payload', () => {
      const valid = validateTelemetryPayload({
        motorId: 'MTR-101',
        vibration: 2.45,
        temperature: 42.1,
        timestamp: '2026-10-16T12:00:00Z',
      });
      expect(valid).toBe(true);
    });

    test('Rejects invalid payload with missing or out-of-bounds metrics', () => {
      expect(validateTelemetryPayload(null)).toBe(false);
      expect(validateTelemetryPayload({ motorId: 'MTR-101' })).toBe(false);
      expect(validateTelemetryPayload({ motorId: 'MTR-101', vibration: -5, temperature: 40 })).toBe(false);
      expect(validateTelemetryPayload({ motorId: '', vibration: 2.0, temperature: 40 })).toBe(false);
    });
  });

  describe('3. User Authentication & Cookie Session', () => {
    test('Registers new user with unique credentials', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.username).toBe(testUser.username.toLowerCase());
      testUserId = res.body.user.id;
      authToken = res.body.token;

      // Extract cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      authCookie = cookies.find((c) => c.startsWith('motorvibe_token='));
      expect(authCookie).toBeDefined();
      expect(authCookie).toMatch(/HttpOnly/i);
    });

    test('Prevents duplicate username/email registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    test('Authenticates valid user login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: testUser.username,
          password: testUser.password,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    });

    test('Rejects invalid password login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: testUser.username,
          password: 'WrongPassword!',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('Fetches current authenticated profile via /me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [authCookie]);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.id).toBe(testUserId);
    });

    test('Logs out by clearing the HTTP-only session cookie', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [authCookie]);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.headers['set-cookie'][0]).toMatch(/motorvibe_token=;/);
      expect(res.headers['set-cookie'][0]).toMatch(/Expires=Thu, 01 Jan 1970/i);
    });
  });

  describe('4. Motor Registration & Test Lifecycle', () => {
    test('Creates new industrial motor', async () => {
      const res = await request(app)
        .post('/api/motors')
        .set('Cookie', [authCookie])
        .send({
          motor_code: 'MTR-TEST-01',
          name: 'Cooling Water Pump Motor',
          description: 'High-pressure circulation 45kW pump motor',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.motor.motor_code).toBe('MTR-TEST-01');
      testMotorId = res.body.motor.id;
    });

    test('Starts a new test in simulation mode', async () => {
      const res = await request(app)
        .post('/api/tests/start')
        .set('Cookie', [authCookie])
        .send({
          motorId: testMotorId,
          mode: 'simulation',
          testCondition: 'Imbalance',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.test.status).toBe('running');
      expect(res.body.test.mode).toBe('simulation');
      testRunId = res.body.test.id;
    });

    test('Waits for simulated telemetry tick and verifies persistence', async () => {
      // Allow 2.5 seconds for simulation timer to emit & persist telemetry
      await new Promise((r) => setTimeout(r, 2500));

      const res = await request(app)
        .get(`/api/tests/${testRunId}/telemetry`)
        .set('Cookie', [authCookie]);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.telemetry)).toBe(true);
      expect(res.body.telemetry.length).toBeGreaterThanOrEqual(1);
      expect(Number(res.body.telemetry[0].vibration)).toBeGreaterThan(0);
    });

    test('Stops active test run', async () => {
      const res = await request(app)
        .post(`/api/tests/${testRunId}/stop`)
        .set('Cookie', [authCookie]);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.test.status).toBe('stopped');
    });

    test('Finishes and saves test run', async () => {
      const res = await request(app)
        .post(`/api/tests/${testRunId}/finish`)
        .set('Cookie', [authCookie]);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.test.status).toBe('completed');
      expect(res.body.test.reading_count).toBeGreaterThan(0);
    });

    test('Lists tests in history with filter', async () => {
      const res = await request(app)
        .get(`/api/tests?motorId=${testMotorId}`)
        .set('Cookie', [authCookie]);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.tests.length).toBeGreaterThanOrEqual(1);
    });

    test('Generates dashboard summary', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Cookie', [authCookie]);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary.totalMotors).toBeGreaterThanOrEqual(1);
      expect(res.body.summary.totalTests).toBeGreaterThanOrEqual(1);
    });
  });
});
