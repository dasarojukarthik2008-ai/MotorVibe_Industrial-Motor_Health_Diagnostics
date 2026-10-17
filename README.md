# MotorVibe — Industrial Motor Vibration & Health Dashboard

**MotorVibe** is an industrial-grade full-stack control system and condition monitoring web application designed for industrial motor vibration analysis, thermal assessment, failure prediction, and maintenance lifecycle tracking.

Built for university technology expos and mission-critical engineering deployments, MotorVibe supports dual testing paradigms:
1. **Simulation Mode**: Backend algorithmic generation of dynamic telemetry covering 5 distinct industrial fault conditions.
2. **Hardware Mode**: Direct real-time sensor telemetry ingested from physical ESP32 microcontrollers over Wi-Fi and MQTT.

---

## 1. System Architecture

```text
       ┌────────────────────────┐
       │     Physical ESP32     │
       │   Sensors (Vib/Temp)   │
       └───────────┬────────────┘
                   │ Wi-Fi / MQTT
                   ▼
       ┌────────────────────────┐
       │   MQTT Telemetry Hub   │
       │   (EMQX / Mosquitto)   │
       └───────────┬────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│               MotorVibe Node.js Gateway               │
│  - Parameterized Database Client                       │
│  - Rule-Based ISO 10816 Health Engine                  │
│  - Multi-Condition Simulation Engine                   │
│  - Authenticated Socket.IO Event Broker                │
└───────────┬────────────────────────────────┬───────────┘
            │                                │
            ▼                                ▼
┌───────────────────────┐        ┌───────────────────────┐
│  PostgreSQL Database  │        │   React Engineering   │
│  - Users & Sessions   │        │       Dashboard       │
│  - Monitored Motors   │        │  - Recharts Live Wave │
│  - Motor Tests        │        │  - Diagnostics Gauge  │
│  - Telemetry Stream   │        │  - Compare & Reports  │
└───────────────────────┘        └───────────────────────┘
```

---

## 2. Technology Stack

### Frontend
- **React 18** (JavaScript / JSX) with **Vite**
- **Tailwind CSS** with a bright industrial palette: light grey background, white cards, navy text, cyan/teal accents, and accessible status colors
  - Monospace Telemetry Typography: JetBrains Mono / Fira Code
- **Recharts**: High-performance dual-axis live sensor charts with threshold bounds
- **Lucide React**: Clean vector iconography
- **React Router v6**: Client-side single-page routing with auth guards

### Backend & Middleware
- **Node.js 24** & **Express.js**
- **PostgreSQL Client (`pg.Pool`)**: Parameterized queries and connection pooling
- **Socket.IO**: Authenticated real-time bidirectional telemetry streaming
- **MQTT.js**: Industrial broker client with dynamic topic subscription
- **bcryptjs**: Salted password hashing (10 rounds)
- **jsonwebtoken (JWT)**: Cryptographically signed authentication stored in `httpOnly` cookies

---

## 3. Prerequisites

- **Node.js**: `v20.0+` (tested on `v24.15.0`)
- **Package Manager**: `pnpm` (v12) or `npm`
- **Database**: **PostgreSQL 14+** (tested on PostgreSQL 18)
- **MQTT Broker**: Public broker (`broker.emqx.io`) or local Mosquitto instance

---

## 4. Quickstart Guide

### Step 1: Clone & Configure Environment

Create a `.env` file only if one does not already exist; keep any existing local configuration:

```bash
test -f .env || cp .env.example .env
```

Verify your database credentials in `.env`:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# PostgreSQL connection string
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/motorvibedb

# Session Security
JWT_SECRET=replace-with-a-long-random-secret
COOKIE_SECURE=false

# MQTT Broker (Hardware Telemetry)
MQTT_BROKER_URL=mqtt://broker.emqx.io:1883
MQTT_TOPIC=motorvibe/+/telemetry

# Simulation Frequency
SIMULATION_INTERVAL_MS=1000
```

### Step 2: Install Dependencies

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

`pnpm` can also be used if installed; the root npm scripts below work with npm.

### Step 3: Initialize PostgreSQL Schema

Run the idempotent database schema initialization:

```bash
npm run db:init
```

This creates all required tables (`users`, `motors`, `motor_tests`, `telemetry`), foreign keys, and indexes.

### Step 4: Run the Application

Start both the backend server and frontend development server simultaneously:

```bash
npm run dev
```

- **Frontend Application**: `http://localhost:5173`
- **Backend REST Gateway**: `http://localhost:5000`

The Vite development proxy reads `PORT` from the root `.env` and forwards `/api` and `/socket.io` to that backend port. Keep the browser API base relative (`/api`) so authentication cookies remain same-origin during development.

For separate terminals, run `npm run dev:backend` and `npm run dev:frontend`. Confirm PostgreSQL is reachable at the `DATABASE_URL` in `.env`, then visit `http://localhost:5000/api/health`; a successful response includes `"database":"connected"`. If it reports unhealthy, start PostgreSQL, check the database name and credentials in `.env`, then run `npm run db:init`.

---

## 5. REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Register new operator account
- `POST /api/auth/login`: Authenticate and receive `httpOnly` session cookie
- `POST /api/auth/logout`: Invalidate session and clear auth cookie
- `GET /api/auth/me`: Retrieve current authenticated profile

### Motor Assets (`/api/motors`)
- `GET /api/motors`: List user's registered motors with historical test counts
- `POST /api/motors`: Register new industrial motor (`motor_code`, `name`, `description`)
- `GET /api/motors/:id`: Get detailed motor asset metadata

### Test Execution & Archival (`/api/tests`)
- `POST /api/tests/start`: Initiate a test (`motorId`, `mode`, `testCondition`)
- `POST /api/tests/:id/stop`: Stop active streaming and halt simulation
- `POST /api/tests/:id/finish`: Calculate final aggregate metrics and finalize test
- `GET /api/tests`: List tests with optional filters (`motorId`, `status`, `mode`, `condition`, `search`)
- `GET /api/tests/:id`: Get full saved record of a test
- `GET /api/tests/:id/telemetry`: Retrieve raw telemetry data points
- `GET /api/tests/compare?firstId=1&secondId=2`: Side-by-side delta analysis and rule-based diagnostic conclusion

### Dashboard & Telemetry Health (`/api/dashboard`, `/api/health`)
- `GET /api/dashboard/summary`: High-level KPI aggregations, alerts, and trend records
- `GET /api/hardware/status?motorId=1`: Real-time MQTT broker connectivity and packet status
- `GET /api/health`: Database pool and gateway uptime check

---

## 6. Testing Modes

### Mode A: Simulation Mode
Generates backend-persisted telemetry every second with realistic industrial variance:
1. **Normal**: Nominal vibration ($1.2 - 2.2\text{ mm/s}$) and temperature ($35 - 45^\circ\text{C}$).
2. **Bearing Fault**: Progressively climbing vibration and moderate thermal rise.
3. **Imbalance**: Heavy sinusoidal oscillatory swings ($2.5 - 5.5\text{ mm/s}$).
4. **Overheating**: Accelerating temperature rise ($45 - 90^\circ\text{C}+$ Nominal vibration).
5. **Loose Mounting**: Elevated baseline vibration with sharp shock spikes ($6.5 - 8.5\text{ mm/s}$).

### Mode B: Hardware Mode (Real ESP32)
- Connects to MQTT broker and listens on `motorvibe/+/telemetry`.
- Telemetry payload format:
  ```json
  {"motorId":"MTR-101","vibration":2.45,"temperature":38.2,"timestamp":"2026-10-16T12:00:00Z"}
  ```
- Refer to [`hardware/README.md`](file:///Users/karthik/Desktop/KLH/1st-Sem(2nd%20yr)/FSWD/Project/MotorVibe/hardware/README.md) for full wiring schematics and Arduino C++ code.
- To emulate real hardware packets from the terminal:
  ```bash
  node hardware/test_transmitter.js MTR-101
  ```

---

## 7. Verification & Testing

Execute automated unit, integration, and syntax checks:

```bash
# Run backend test suite (Auth, Health Rules, MQTT, Simulation)
pnpm test

# Run frontend & backend linting
pnpm lint

# Build production bundle
pnpm build
```

---

## 8. License & University Presentation

Developed for academic demonstration at KL University Hyderabad. ISO 10816 mechanical condition evaluation algorithms provided for demonstration and educational testing.
