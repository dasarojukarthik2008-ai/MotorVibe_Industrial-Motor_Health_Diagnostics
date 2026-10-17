const { query } = require('../db/pool');
const { analyzeMotorHealth } = require('./healthAnalysis');
const config = require('../config/env');

const activeSimulations = new Map();

/**
 * Generates synthetic telemetry point based on test condition and tick index
 */
function generateConditionTelemetry(condition, tick) {
  let vibration = 1.5;
  let temperature = 40.0;
  let recentSpike = false;

  const jitter = (Math.random() - 0.5);

  switch (condition) {
    case 'Bearing Fault': {
      // Progressively rising vibration + moderate temperature rise
      const ramp = Math.min(tick * 0.12, 4.5);
      vibration = 2.4 + ramp + (jitter * 0.4);
      temperature = 42.0 + Math.min(tick * 0.4, 25.0) + (jitter * 0.8);
      break;
    }
    case 'Imbalance': {
      // Heavy cyclic vibration fluctuations
      const wave = Math.sin(tick * 0.5) * 1.8;
      vibration = 3.6 + wave + (jitter * 0.6);
      temperature = 42.0 + (jitter * 1.2);
      break;
    }
    case 'Overheating': {
      // Steady low vibration, accelerating heat
      vibration = 1.8 + (jitter * 0.3);
      temperature = 45.0 + Math.min(tick * 1.1, 48.0) + (jitter * 0.5);
      break;
    }
    case 'Loose Mounting': {
      // Elevated baseline vibration with intermittent shock spikes
      const isSpike = (tick % 5 === 0) || Math.random() < 0.2;
      recentSpike = isSpike;
      vibration = isSpike ? (6.8 + Math.random() * 2.0) : (3.6 + jitter * 0.5);
      temperature = 43.0 + (jitter * 0.9);
      break;
    }
    case 'Normal':
    default: {
      // Stable nominal conditions
      vibration = 1.6 + (jitter * 0.4);
      temperature = 39.0 + (jitter * 0.7);
      break;
    }
  }

  return {
    vibration: Math.max(0.1, Math.round(vibration * 100) / 100),
    temperature: Math.round(temperature * 10) / 10,
    recentSpike,
  };
}

/**
 * Starts backend simulation loop for a motor test
 */
function startSimulation(testId, motorId, userId, condition, io) {
  if (activeSimulations.has(testId)) {
    return;
  }

  let tick = 0;
  let sumVib = 0;
  let maxVib = 0;
  let sumTemp = 0;
  let maxTemp = 0;
  let abnormalEvents = 0;
  const startTime = Date.now();

  const interval = setInterval(async () => {
    tick += 1;
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);
    const { vibration, temperature, recentSpike } = generateConditionTelemetry(condition, tick);

    sumVib += vibration;
    maxVib = Math.max(maxVib, vibration);
    sumTemp += temperature;
    maxTemp = Math.max(maxTemp, temperature);

    const avgVib = Math.round((sumVib / tick) * 100) / 100;
    const avgTemp = Math.round((sumTemp / tick) * 10) / 10;

    const analysis = analyzeMotorHealth(vibration, temperature, {
      testCondition: condition,
      recentSpike,
    });

    if (analysis.healthStatus !== 'Healthy') {
      abnormalEvents += 1;
    }

    const timestamp = new Date().toISOString();

    try {
      // 1. Insert telemetry point
      await query(
        `INSERT INTO telemetry (test_id, motor_id, source, vibration, temperature, timestamp)
         VALUES ($1, $2, 'simulation', $3, $4, $5)`,
        [testId, motorId, vibration, temperature, timestamp]
      );

      // 2. Update motor_tests aggregate row
      await query(
        `UPDATE motor_tests
         SET duration_seconds = $1,
             reading_count = $2,
             average_vibration = $3,
             maximum_vibration = $4,
             average_temperature = $5,
             maximum_temperature = $6,
             health_score = $7,
             health_status = $8,
             possible_fault = $9,
             priority = $10,
             recommendation = $11,
             abnormal_events = $12
         WHERE id = $13`,
        [
          durationSeconds,
          tick,
          avgVib,
          maxVib,
          avgTemp,
          maxTemp,
          analysis.healthScore,
          analysis.healthStatus,
          analysis.possibleFault,
          analysis.priority,
          analysis.recommendation,
          abnormalEvents,
          testId,
        ]
      );

      // 3. Emit telemetry via Socket.IO
      const telemetryPayload = {
        testId,
        motorId,
        source: 'simulation',
        vibration,
        temperature,
        timestamp,
        analysis,
        stats: {
          readingCount: tick,
          durationSeconds,
          avgVibration: avgVib,
          maxVibration: maxVib,
          avgTemperature: avgTemp,
          maxTemperature: maxTemp,
          abnormalEvents,
        },
      };

      if (io) {
        io.to(`test_${testId}`).emit('telemetry_reading', telemetryPayload);
        io.to(`user_${userId}`).emit('active_test_stream', telemetryPayload);
      }
    } catch (err) {
      console.error(`Simulation tick error for test ${testId}:`, err.message);
    }
  }, config.simulationIntervalMs);

  activeSimulations.set(testId, interval);
}

/**
 * Stops an active simulation timer
 */
function stopSimulation(testId) {
  if (activeSimulations.has(testId)) {
    clearInterval(activeSimulations.get(testId));
    activeSimulations.delete(testId);
    return true;
  }
  return false;
}

/**
 * Checks if a test simulation is running
 */
function isSimulationActive(testId) {
  return activeSimulations.has(testId);
}

module.exports = {
  startSimulation,
  stopSimulation,
  isSimulationActive,
};
