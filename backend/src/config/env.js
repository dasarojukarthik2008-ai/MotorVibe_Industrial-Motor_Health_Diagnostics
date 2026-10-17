const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend or root .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/motorvibedb',
  jwtSecret: process.env.JWT_SECRET || 'motorvibe_super_secret_jwt_key_2026_industrial_iot_secure',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  mqttBrokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://broker.emqx.io:1883',
  mqttUsername: process.env.MQTT_USERNAME || '',
  mqttPassword: process.env.MQTT_PASSWORD || '',
  mqttTopic: process.env.MQTT_TOPIC || 'motorvibe/+/telemetry',
  simulationIntervalMs: parseInt(process.env.SIMULATION_INTERVAL_MS, 10) || 1000,
};

module.exports = config;
