const mqtt = require('mqtt');
const config = require('../config/env');
const { query } = require('../db/pool');
const { analyzeMotorHealth } = require('./healthAnalysis');

let mqttClient = null;
let ioInstance = null;

// Hardware telemetry metrics state
const hardwareStatus = {
  brokerConnected: false,
  brokerUrl: config.mqttBrokerUrl,
  topicSubscribed: config.mqttTopic,
  lastReadingTimestamp: null,
  readingsReceivedCount: 0,
  activeDevices: new Map(), // motorCode -> { lastSeen, packetCount }
  lastError: null,
};

/**
 * Initializes MQTT client connection and sets up topic subscription
 */
function initMQTT(io) {
  ioInstance = io;

  try {
    const options = {
      reconnectPeriod: 5000,
      connectTimeout: 10000,
    };

    if (config.mqttUsername) {
      options.username = config.mqttUsername;
      options.password = config.mqttPassword;
    }

    console.log(`Connecting to MQTT broker at ${config.mqttBrokerUrl}...`);
    mqttClient = mqtt.connect(config.mqttBrokerUrl, options);

    mqttClient.on('connect', () => {
      hardwareStatus.brokerConnected = true;
      hardwareStatus.lastError = null;
      console.log(`✓ Connected to MQTT Broker. Subscribing to: ${config.mqttTopic}`);
      mqttClient.subscribe(config.mqttTopic, (err) => {
        if (err) {
          console.error(`Failed to subscribe to MQTT topic ${config.mqttTopic}:`, err.message);
        }
      });
      if (ioInstance) {
        ioInstance.emit('mqtt_status', { connected: true, brokerUrl: config.mqttBrokerUrl });
      }
    });

    mqttClient.on('message', async (topic, messageBuffer) => {
      try {
        const payloadStr = messageBuffer.toString();
        const payload = JSON.parse(payloadStr);
        await handleIncomingTelemetry(topic, payload);
      } catch (err) {
        console.error('Failed to parse incoming MQTT message:', err.message);
      }
    });

    mqttClient.on('error', (err) => {
      hardwareStatus.lastError = err.message;
      console.warn('MQTT client warning/error:', err.message);
    });

    mqttClient.on('offline', () => {
      hardwareStatus.brokerConnected = false;
      if (ioInstance) {
        ioInstance.emit('mqtt_status', { connected: false });
      }
    });

    mqttClient.on('reconnect', () => {
      console.log('Attempting MQTT broker reconnect...');
    });
  } catch (err) {
    hardwareStatus.lastError = err.message;
    console.error('MQTT initialization error:', err.message);
  }
}

/**
 * Validates payload structure and telemetry value bounds
 */
function validateTelemetryPayload(data) {
  if (!data || typeof data !== 'object') return false;
  const { motorId, vibration, temperature } = data;
  if (!motorId || typeof motorId !== 'string') return false;
  if (typeof vibration !== 'number' || isNaN(vibration) || vibration < 0 || vibration > 100) return false;
  if (typeof temperature !== 'number' || isNaN(temperature) || temperature < -40 || temperature > 200) return false;
  return true;
}

/**
 * Processes incoming valid hardware telemetry message
 */
async function handleIncomingTelemetry(topic, payload) {
  if (!validateTelemetryPayload(payload)) {
    return;
  }

  const motorCode = payload.motorId.trim();
  const vibration = Math.round(Number(payload.vibration) * 100) / 100;
  const temperature = Math.round(Number(payload.temperature) * 10) / 10;
  const timestamp = payload.timestamp && !isNaN(Date.parse(payload.timestamp))
    ? new Date(payload.timestamp).toISOString()
    : new Date().toISOString();

  // Update hardware device heartbeat
  hardwareStatus.lastReadingTimestamp = timestamp;
  hardwareStatus.readingsReceivedCount += 1;

  const currentDev = hardwareStatus.activeDevices.get(motorCode) || { packetCount: 0 };
  hardwareStatus.activeDevices.set(motorCode, {
    lastSeen: timestamp,
    packetCount: currentDev.packetCount + 1,
  });

  try {
    // 1. Locate active running hardware test for this motorCode
    const testRes = await query(
      `SELECT t.*, m.motor_code, m.created_by AS owner_user_id
       FROM motor_tests t
       JOIN motors m ON t.motor_id = m.id
       WHERE m.motor_code = $1 
         AND t.mode = 'hardware' 
         AND t.status = 'running'
       ORDER BY t.started_at DESC
       LIMIT 1`,
      [motorCode]
    );

    if (testRes.rows.length === 0) {
      // Telemetry received for a motor, but no test is currently active
      if (ioInstance) {
        ioInstance.emit('hardware_idle_telemetry', {
          motorCode,
          vibration,
          temperature,
          timestamp,
        });
      }
      return;
    }

    const test = testRes.rows[0];
    const testId = test.id;
    const motorId = test.motor_id;
    const userId = test.owner_user_id;

    // 2. Persist telemetry to PostgreSQL
    await query(
      `INSERT INTO telemetry (test_id, motor_id, source, vibration, temperature, timestamp)
       VALUES ($1, $2, 'hardware', $3, $4, $5)`,
      [testId, motorId, vibration, temperature, timestamp]
    );

    // 3. Compute running stats
    const statsRes = await query(
      `SELECT 
         COUNT(*) as reading_count,
         AVG(vibration) as avg_vib,
         MAX(vibration) as max_vib,
         AVG(temperature) as avg_temp,
         MAX(temperature) as max_temp
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
    const durationSeconds = Math.max(1, Math.round((Date.now() - startedTime) / 1000));

    // 4. Centralized health analysis
    const analysis = analyzeMotorHealth(vibration, temperature, {
      testCondition: test.test_condition,
    });

    const abnormalInc = analysis.healthStatus !== 'Healthy' ? 1 : 0;
    const totalAbnormal = (test.abnormal_events || 0) + abnormalInc;

    // 5. Update motor_tests record
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
        readingCount,
        avgVib,
        maxVib,
        avgTemp,
        maxTemp,
        analysis.healthScore,
        analysis.healthStatus,
        analysis.possibleFault,
        analysis.priority,
        analysis.recommendation,
        totalAbnormal,
        testId,
      ]
    );

    // 6. Broadcast to authenticated room
    const telemetryPayload = {
      testId,
      motorId,
      motorCode,
      source: 'hardware',
      vibration,
      temperature,
      timestamp,
      analysis,
      stats: {
        readingCount,
        durationSeconds,
        avgVibration: avgVib,
        maxVibration: maxVib,
        avgTemperature: avgTemp,
        maxTemperature: maxTemp,
        abnormalEvents: totalAbnormal,
      },
    };

    if (ioInstance) {
      ioInstance.to(`test_${testId}`).emit('telemetry_reading', telemetryPayload);
      ioInstance.to(`user_${userId}`).emit('active_test_stream', telemetryPayload);
    }
  } catch (err) {
    console.error(`Hardware telemetry handling error for ${motorCode}:`, err.message);
  }
}

/**
 * Returns current hardware telemetry service status
 */
function getHardwareStatus(motorCode = null) {
  let deviceStatus = null;
  if (motorCode) {
    deviceStatus = hardwareStatus.activeDevices.get(motorCode) || {
      lastSeen: null,
      packetCount: 0,
      connected: false,
    };
  }

  return {
    brokerConnected: hardwareStatus.brokerConnected,
    brokerUrl: hardwareStatus.brokerUrl,
    topicSubscribed: hardwareStatus.topicSubscribed,
    lastReadingTimestamp: hardwareStatus.lastReadingTimestamp,
    readingsReceivedCount: hardwareStatus.readingsReceivedCount,
    device: deviceStatus,
    activeDeviceCount: hardwareStatus.activeDevices.size,
  };
}

function closeMQTT() {
  if (mqttClient) {
    try {
      mqttClient.end(true);
    } catch (_err) {
      // ignore
    }
    hardwareStatus.brokerConnected = false;
  }
}

module.exports = {
  initMQTT,
  closeMQTT,
  getHardwareStatus,
  validateTelemetryPayload,
  handleIncomingTelemetry,
};
