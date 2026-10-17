# MotorVibe — Hardware Mode Integration & ESP32 Telemetry Guide

This document specifies the hardware communication interface, MQTT telemetry schema, and ESP32 firmware implementation for **MotorVibe: Industrial Motor Vibration & Health Dashboard**.

---

## 1. Physical Architecture

```text
[ Industrial Motor ]
         │
  [ Physical Sensors ]
  - Accelerometer: MPU-6050 / ADXL345 (Vibration Velocity RMS mm/s)
  - Thermal Probe: DS18B20 / NTC Thermistor (Bearing Temperature °C)
         │
   [ ESP32 Microcontroller ]
         │ (2.4 GHz Wi-Fi)
         ▼
   [ MQTT Broker ] (Default: broker.emqx.io:1883 or local Mosquitto)
         │
   [ Node.js MotorVibe Gateway ]
         │ (pg Connection Pool)
         ▼
   [ PostgreSQL Database ] ──► [ Socket.IO Stream ] ──► [ React Dashboard ]
```

---

## 2. MQTT Topic Specification

MotorVibe backend subscribes to:

```text
motorvibe/+/telemetry
```

Where `+` is the unique **Motor Code** (e.g., `MTR-101`, `MTR-PUMP-01`).

### Example Publication Topic:
```text
motorvibe/MTR-101/telemetry
```

---

## 3. Telemetry JSON Payload Schema

Incoming messages must be valid JSON formatted as follows:

```json
{
  "motorId": "MTR-101",
  "vibration": 2.45,
  "temperature": 38.2,
  "timestamp": "2026-10-16T12:00:00Z"
}
```

### Parameter Validation Rules:

| Field | Type | Unit | Range | Description |
| :--- | :--- | :--- | :--- | :--- |
| `motorId` | `String` | — | Non-empty | Asset ID matching registered motor code |
| `vibration` | `Number` | `mm/s` | `0.00` – `50.00` | RMS vibration velocity |
| `temperature` | `Number` | `°C` | `-40.0` – `150.0` | Surface or bearing housing temperature |
| `timestamp` | `String` | ISO 8601 | Valid Date | Timestamp of acquisition (auto-stamped if omitted) |

> [!IMPORTANT]
> **Genuine Telemetry Guarantee**: MotorVibe's Hardware Mode never fabricates fake telemetry. If the broker is offline or the ESP32 is disconnected, the console displays a genuine waiting/disconnected state.

---

## 4. ESP32 Arduino C++ Firmware Example

Install the following libraries in Arduino IDE or PlatformIO:
- `PubSubClient` by Nick O'Leary
- `ArduinoJson` by Benoit Blanchon (v6 or v7)

### Arduino Sketch (`motorvibe_esp32.ino`):

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// Wi-Fi Credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Broker Settings
const char* mqtt_server = "broker.emqx.io";
const int mqtt_port = 1883;
const char* motor_id = "MTR-101";

// Topic: motorvibe/<motorId>/telemetry
char telemetry_topic[64];

WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastMsg = 0;
const long interval = 1000; // Publish every 1 second

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWi-Fi connected. IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP32_MotorVibe_" + String(random(0xffff), HEX);
    if (client.connect(clientId.c_str())) {
      Serial.println("connected!");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" Retrying in 5 seconds...");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  snprintf(telemetry_topic, sizeof(telemetry_topic), "motorvibe/%s/telemetry", motor_id);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastMsg > interval) {
    lastMsg = now;

    // Read actual physical sensors:
    // float vibrationRMS = readVibrationSensor(); // e.g. MPU6050
    // float motorTemp = readTemperatureProbe();   // e.g. DS18B20
    
    // Sample readings for verification:
    float vibrationRMS = 2.15;
    float motorTemp = 42.5;

    StaticJsonDocument<200> doc;
    doc["motorId"] = motor_id;
    doc["vibration"] = vibrationRMS;
    doc["temperature"] = motorTemp;

    char buffer[256];
    serializeJson(doc, buffer);

    client.publish(telemetry_topic, buffer);
    Serial.print("Published telemetry: ");
    Serial.println(buffer);
  }
}
```

---

## 5. Simulating Real Hardware via Shell Command

You can verify hardware reception using `mosquitto_pub` or a test script:

```bash
# Publish 1 valid telemetry point using mosquitto_pub
mosquitto_pub -h broker.emqx.io -p 1883 -t "motorvibe/MTR-101/telemetry" \
  -m '{"motorId":"MTR-101","vibration":3.45,"temperature":44.2,"timestamp":"2026-10-16T12:00:00Z"}'
```

Or run our included Node.js test transmitter in `hardware/test_transmitter.js`.
