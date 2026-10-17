/**
 * MotorVibe Hardware Telemetry Test Transmitter
 * Emulates physical ESP32 device transmitting real MQTT telemetry packets.
 */
const mqtt = require('mqtt');

const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://broker.emqx.io:1883';
const motorCode = process.argv[2] || 'MTR-101';
const topic = `motorvibe/${motorCode}/telemetry`;

console.log(`Connecting to MQTT broker at ${brokerUrl}...`);
const client = mqtt.connect(brokerUrl);

client.on('connect', () => {
  console.log(`✓ Connected to MQTT broker.`);
  console.log(`Publishing hardware telemetry stream to: ${topic}`);
  console.log(`Press Ctrl+C to terminate.`);

  let tick = 0;
  setInterval(() => {
    tick += 1;
    const vibration = Math.round((2.2 + (Math.sin(tick * 0.4) * 0.8) + (Math.random() * 0.3)) * 100) / 100;
    const temperature = Math.round((41.0 + (tick * 0.1) + (Math.random() * 0.5)) * 10) / 10;

    const payload = {
      motorId: motorCode,
      vibration,
      temperature,
      timestamp: new Date().toISOString(),
    };

    client.publish(topic, JSON.stringify(payload));
    console.log(`[Tx] Packet #${tick} published:`, payload);
  }, 1000);
});

client.on('error', (err) => {
  console.error('MQTT error:', err.message);
});
