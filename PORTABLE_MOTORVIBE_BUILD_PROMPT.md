# Portable MotorVibe Master Build Prompt

Copy everything after the divider into an AI coding agent opened in a new project folder. Build the application described here from scratch; no prior source files or conversation are available.

---

## Goal and working rules

Create **MotorVibe — Industrial Motor Vibration & Health Dashboard**, a full-stack app for operator accounts, motor assets, simulated or genuine hardware telemetry tests, transparent rule-based health analysis, PostgreSQL persistence, history, comparison, and printable reports.

First inspect the computer (Windows/macOS/Linux), current workspace, existing files, Node.js, package managers, and PostgreSQL tools. Preserve existing work; never run destructive cleanup. Use JavaScript and JSX, not TypeScript. Keep code readable, split large files into small reusable modules, avoid unnecessary dependencies, and fix errors instead of hiding them.

PostgreSQL is required persistent storage. Do not substitute MySQL, SQLite, in-memory records, localStorage persistence, mock authentication, or fake API responses. Simulation may generate synthetic values and must label them as simulated. Hardware mode must only process actual MQTT packets and must never fabricate or fall back to simulation. Fail clearly if required services are unavailable. Hash passwords; never store plaintext passwords or return hashes. Use parameterized SQL and enforce per-user ownership on every asset/test query and socket room. Never include real secrets, user records, database contents, or machine-specific absolute paths in code or docs.

Treat diagnosis as a preliminary, rule-based educational demonstration. Do not claim machine learning, scientific validation, or certification.

## Tooling and fresh-computer setup

- Use a supported Node.js LTS compatible with Vite 6. Check and report the detected version; do not assume a particular patch version.
- This project is a pnpm workspace (lockfile format 9). Pin the chosen pnpm version in root `package.json`. Do not assume pnpm is global: prefer Corepack where available; otherwise explain a platform-appropriate way to use the pinned version. Do not silently change package managers or create competing lockfiles.
- Support Windows, macOS, and Linux commands where practical. Use PowerShell examples on Windows and shell examples on macOS/Linux.
- Inspect before scaffolding; create files without overwriting user work.
- PostgreSQL 14+ is the baseline. Each installation needs its own database and correct `DATABASE_URL`. Do not assume another computer's database.
- Create root/backend `.env.example` files with placeholders, and ignore real `.env` files. Explain how the user copies examples to local `.env` files and fills in their own database URL, random JWT secret, and optional MQTT credentials.
- Configure and start frontend/backend, initialize schema, and verify registration, login, simulation persistence, history and related features. Hardware verification requires a broker and physical ESP32/sensors; be explicit about anything unavailable or untested.
- Never run dangerous cleanup commands or delete existing projects. Never hide failures by using fallback credentials or fake data.

## Reference technology versions

Match the existing project's technology choices and declared package ranges:

Frontend: React/React DOM `^18.3.1`, Vite `^6.2.0`, @vitejs/plugin-react `^4.3.4`, React Router DOM `^6.28.2`, Recharts `^2.15.1`, socket.io-client `^4.8.1`, lucide-react `^0.475.0`, Tailwind CSS `^3.4.17`, PostCSS `^8.5.3`, Autoprefixer `^10.4.20`, ESLint `^8.57.1`, eslint-plugin-react `^7.37.4`, eslint-plugin-react-hooks `^5.1.0`.

Backend: Node.js/CommonJS, Express `^4.21.2`, cors `^2.8.5`, cookie-parser `^1.4.7`, dotenv `^16.4.7`, pg `^8.13.3`, bcryptjs `^3.0.2`, jsonwebtoken `^9.0.2`, socket.io `^4.8.1`, mqtt `^5.10.3`.

Tooling: concurrently `^9.1.2`, nodemon `^3.1.9`, Jest `^29.7.0`, Supertest `^7.0.0`, cross-env `^7.0.3`. Keep dependency versions and lockfile consistent.

## Expected folder layout

```text
motorvibe/
  package.json  pnpm-workspace.yaml  pnpm-lock.yaml  .gitignore  .env.example  README.md
  database/schema.sql
  backend/package.json
  backend/.env.example
  backend/src/server.js
  backend/src/config/{env.js,thresholds.js}
  backend/src/db/{pool.js,initDb.js}
  backend/src/middleware/{auth.js,errorHandler.js}
  backend/src/routes/{authRoutes.js,dashboardRoutes.js,motorRoutes.js,testRoutes.js}
  backend/src/services/{healthAnalysis.js,mqttService.js,simulationService.js}
  backend/tests/motorvibe.test.js
  frontend/package.json  frontend/index.html  frontend/vite.config.js
  frontend/tailwind.config.js  frontend/postcss.config.js  frontend/.eslintrc.cjs
  frontend/src/{main.jsx,App.jsx,index.css}
  frontend/src/context/AuthContext.jsx
  frontend/src/services/{api.js,socket.js}
  frontend/src/components/{Layout.jsx,Navbar.jsx,Sidebar.jsx,MetricCard.jsx,StatusBadge.jsx,HealthGauge.jsx,TelemetryChart.jsx,AddMotorModal.jsx}
  frontend/src/components/landing/{LandingNavbar.jsx,LandingHero.jsx,LandingModes.jsx,LandingFeatures.jsx}
  frontend/src/pages/{LandingPage.jsx,LoginPage.jsx,RegisterPage.jsx,DashboardPage.jsx,NewTestPage.jsx,HistoryPage.jsx,TestDetailsPage.jsx,ComparePage.jsx,ReportsPage.jsx}
  hardware/{README.md,test_transmitter.js}
```

Build artifacts and dependencies must be gitignored. The transmitter, if included, must be clearly labelled synthetic test data, never physical sensor data.

## Product and UI

Use a responsive light industrial theme: pale blue-grey background, white cards, navy text, slate-muted text, cyan/teal accents, green/amber/red statuses, subtle borders/shadows, accessible contrast and visible keyboard focus. Use Inter/system sans and monospace technical labels, Lucide icons, Tailwind CSS, Recharts.

Public pages:
- `/`: sticky MotorVibe brand navbar, anchor links, login/register actions (or dashboard for signed-in user), hero with description and calls to action, system overview, Simulation/Hardware mode cards, capability cards, workflow, footer.
- `/login` and `/register`: validated forms with errors/pending states.

Protected shell:
- Header with logo, mobile navigation toggle, database/MQTT/socket status, username, sign out.
- Responsive side nav: Dashboard, New Motor Test, Test History, Comparison, Reports; drawer on mobile.
- `/dashboard` is specifically a **capability overview**: heading “Engineered for Industrial Diagnostics” and responsive capability cards for vibration/temperature monitoring, health score, fault detection, maintenance actions, live charts/alerts, history/comparison, and reports. Cards navigate to appropriate features. **Do not show test counts, test results, recent tests, diagnostic alerts, or telemetry charts on the dashboard.**
- `/tests/new`: choose owned motor (quick-add modal), Simulation or Hardware mode, choose simulation profile (Normal, Bearing Fault, Imbalance, Overheating, Loose Mounting); show real hardware connection/waiting status; start/stop/finish; live metric cards, rolling chart, gauge, preliminary fault/recommendation. Before real hardware packets arrive, do not display fake readings as hardware.
- `/history`: owned test filters (motor/status/mode/date/search), desktop table and mobile cards, pagination, details link.
- `/history/:id`: saved record, metrics, diagnosis, telemetry chart, printable view.
- `/compare`: select two owned tests; show records, deltas, simple transparent conclusion (Improving/Stable/Deteriorating).
- `/reports`: select saved test; print-ready report with machine information, aggregate measurements, score, possible condition, recommendation and sign-off fields. A printable report is not a certified or actually signed document.
- Show honest loading, empty, and failure states. Use accessible labels and keyboard behavior.

## Database

Use PostgreSQL and `pg.Pool`, parameterized SQL, safe connection lifecycle, repeatable schema initialization and useful indexes. Missing DB/schema must yield actionable errors.

Tables:
1. `users`: `id SERIAL PRIMARY KEY`; `name VARCHAR(100) NOT NULL`; `username VARCHAR(50) UNIQUE NOT NULL`; `email VARCHAR(255) UNIQUE NOT NULL`; `password_hash VARCHAR(255) NOT NULL`; `created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`. Normalize usernames/emails and enforce uniqueness consistently.
2. `motors`: `id SERIAL PRIMARY KEY`; `motor_code VARCHAR(50) NOT NULL`; `name VARCHAR(100) NOT NULL`; `description TEXT`; `created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE`; `created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`; unique `(created_by,motor_code)`; indexes on owner and code.
3. `motor_tests`: `id SERIAL PRIMARY KEY`; `user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE`; `motor_id INTEGER NOT NULL REFERENCES motors(id) ON DELETE CASCADE`; `mode VARCHAR(20) CHECK (mode IN ('simulation','hardware')) NOT NULL`; `test_condition VARCHAR(50) DEFAULT 'Normal' NOT NULL`; `status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running','stopped','completed')) NOT NULL`; `started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`; nullable `finished_at TIMESTAMPTZ`; `duration_seconds INTEGER DEFAULT 0`; `reading_count INTEGER DEFAULT 0`; average/max vibration and temperature `NUMERIC(10,2) DEFAULT 0`; `health_score NUMERIC(5,1) DEFAULT 100`; `health_status VARCHAR(20) DEFAULT 'Healthy' CHECK (health_status IN ('Healthy','Warning','Critical'))`; `possible_fault VARCHAR(100)`; `priority VARCHAR(20) CHECK (priority IN ('Low','Medium','High'))`; `recommendation TEXT`; `abnormal_events INTEGER DEFAULT 0`; `created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`. Index owner+created time, motor, status.
4. `telemetry`: `id BIGSERIAL PRIMARY KEY`; `test_id INTEGER NOT NULL REFERENCES motor_tests(id) ON DELETE CASCADE`; `motor_id INTEGER NOT NULL REFERENCES motors(id) ON DELETE CASCADE`; `source VARCHAR(20) CHECK (source IN ('simulation','hardware')) NOT NULL`; `vibration NUMERIC(8,2) NOT NULL`; `temperature NUMERIC(8,2) NOT NULL`; `timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`. Index (test_id,timestamp) and motor.

## Authentication and authorization

Register with name, username, email, password, optional confirmPassword. Validate required strings, username (3–50 chars, letters/numbers/dot/underscore/hyphen), email, password length (reference minimum 6), and maximum lengths. Normalize username/email lowercase. Hash with bcryptjs (10 rounds reference). Login uses `identifier` for username or email and password; generic invalid credentials. Sign JWT with private environment secret, seven-day expiry; set `motorvibe_token` HTTP-only cookie, path /, max-age seven days. Local HTTP uses SameSite=Lax and insecure cookie; production HTTPS uses Secure and only use SameSite=None when deployment needs cross-site cookies. No localStorage token. Middleware verifies cookie or optional Bearer token, checks user still exists and attaches safe fields. Auth context checks `/api/auth/me` at startup; guards protect app routes. Logout clears cookie and client/socket state. JWT is stateless; do not claim server-side session revocation. Every SQL query and socket room must enforce owner authorization; never trust client-supplied user ID.

## Backend, routes, and response contracts

Express server: JSON parser, cookie-parser, credentialed CORS limited to configured frontend origin, REST routers, readiness endpoint, centralized error handler, HTTP server plus Socket.IO. No internal errors/SQL/secrets exposed to clients. Use consistent `{success:false,message}`; validation 400, auth 401, missing 404, uniqueness 409, DB unavailable/schema missing 503. Use correct shutdown for HTTP, socket, MQTT, timers and PG pool.

Auth (response examples may include additional safe fields):
- `POST /api/auth/register` body `{name,username,email,password,confirmPassword?}`; 201 `{success:true,user,token?}`, sets cookie.
- `POST /api/auth/login` body `{identifier,password}`; 200 `{success:true,user,token?}`, sets cookie.
- `POST /api/auth/logout`; clears cookie, returns success.
- `GET /api/auth/me`; protected; returns safe user.

Motors (protected, caller-owned):
- `GET /api/motors` => `{success:true,motors:[...]}` with safe latest/count fields.
- `POST /api/motors` body `{motor_code,name,description?}` => 201 `{success:true,motor}`.
- `GET /api/motors/:id` => `{success:true,motor}`.

Tests (protected, caller-owned):
- `POST /api/tests/start` body `{motorId,mode:'simulation'|'hardware',testCondition}`; create running test; return 201 `{success:true,test}`.
- `POST /api/tests/:id/stop` stops timer (if simulation) and marks stopped.
- `POST /api/tests/:id/finish` stops timer and computes final metrics from persisted telemetry, marks completed.
- `GET /api/tests` supports `motorId,status,mode,condition,search,dateFrom,dateTo`, newest first; return `{success:true,totalCount,tests:[...]}`.
- `GET /api/tests/:id` => owned test.
- `GET /api/tests/:id/telemetry` => chronological saved points (reference cap 1000).
- `GET /api/tests/compare?firstId=1&secondId=2` => both owned records and `comparison:{deltaScore,deltaAvgVib,deltaMaxVib,deltaAvgTemp,conclusion,reason}`.

Dashboard/status:
- Optional protected `GET /api/dashboard/summary` may return owned metrics/recent activity for other clients, but capability-only DashboardPage must not call/render it.
- `GET /api/hardware/status?motorId=<owned motor id>` => `{success:true,status:{brokerConnected,brokerUrl,topicSubscribed,lastReadingTimestamp,readingsReceivedCount,device,activeDeviceCount}}`.
- `GET /api/health` checks PostgreSQL with `SELECT 1`; reports status, timestamp, uptime; return 503 if DB unavailable.

Make API mounts match frontend paths exactly; avoid duplicated path prefixes. Validate IDs and query filters. Ensure test lifecycle operations do not affect another owner. Avoid starting multiple uncontrolled simulations for one asset.

## Health analysis

Keep thresholds centralized and explainable. Reference limits:
- vibration RMS: normal 2.8 mm/s, warning 4.5, critical 7.1; maximum penalty 50.
- temperature: normal 55°C, warning 75°C, critical 90°C; maximum penalty 50.
- score = 100 minus both sensor penalties, clamped 0–100, one decimal. For each sensor penalty: 0 below normal; linear 0–20 from normal to warning; 20–40 from warning to critical; 40–50 above critical, capped.
- Healthy >=80; Warning >=50 and <80; Critical <50. Priority Low/Medium/High respectively.
- Alert for each metric above warning, critical when above critical.
- Possible-fault heuristics: combined elevations or Bearing Fault profile => possible bearing problem; critical/isolated heat or Overheating profile => possible overheating; critical vibration/recent spike or Loose Mounting => possible loose mounting; elevated vibration or Imbalance => possible imbalance; otherwise no major issue detected.
- Recommendations: bearing/lubrication inspection; cooling/ventilation inspection; mounting/foundation inspection; shaft alignment/balance inspection; otherwise routine monitoring.
- Return score/status/fault/priority/recommendation/alerts and penalty breakdown. Fault labels are hypotheses, not diagnoses. Keep report thresholds consistent; do not hard-code conflicting limits.

## Simulation

Run synthetic generation server-side at configurable `SIMULATION_INTERVAL_MS` (default 1000ms), persist each sample and update test aggregate and analysis fields. Emit only after successful persistence. Maintain count, averages, maxima, duration, abnormal events. At finish recompute aggregates from PostgreSQL, not only memory. Handle async interval failures and overlap safely; clear timers on stop/finish/shutdown.

Five approximate demo profiles:
- Normal: ~1.6 mm/s, ~39°C, small jitter.
- Bearing Fault: vibration starts ~2.4 then ramps up to ~4.5 additional; temperature starts ~42 then rises up to ~25°C additional.
- Imbalance: vibration centered ~3.6 with sine amplitude ~1.8; temperature ~42.
- Overheating: vibration ~1.8; temperature starts ~45 and ramps by up to ~48°C additional.
- Loose Mounting: baseline vibration ~3.6, intermittent 6.8–8.8 spikes; temperature ~43.
These are synthetic demonstration patterns, not physical models.

## MQTT/hardware

Hardware requires a separately configured reachable MQTT broker and physical ESP32/sensors for genuine data. Code can be created locally; physical wiring and sensor readings cannot be verified without devices. Subscribe by default to `motorvibe/+/telemetry`; e.g. `motorvibe/MTR-101/telemetry`.

Payload:
```json
{"motorId":"MTR-101","vibration":2.45,"temperature":38.2,"timestamp":"2026-10-16T12:00:00Z"}
```
Require nonempty string motorId, numeric vibration and temperature in documented bounds (reference validator: 0–100 mm/s; -40–200°C), optional valid ISO timestamp (server timestamp if omitted). Parse JSON, validate topic/code correspondence and registered motor ownership; reject invalid messages. Reference code normalizes vibration to 2 decimals and temperature to 1. If no active hardware test, report idle state but do not persist as a test. For active test, persist source=hardware, update analysis/stats, and emit events. Track broker status, packet count, last reading and per-device last-seen; broker connected does not mean sensor connected.

Support MQTT username/password via env. Do not put Wi-Fi/broker credentials in firmware. Hardware guide should explain ESP32 Wi-Fi, broker reachability, MQTT topic/schema, real accelerometer and temperature probe, sensor calibration, and firmware libraries (e.g. PubSubClient, ArduinoJson). An optional Node transmitter emits synthetic test packets and must be labelled as such. When broker or device is offline, show real waiting/offline state; never generate fallback readings.

## Socket.IO

Authenticate connection with cookie JWT (or explicitly supported auth token); browser uses credentials. Automatically join `user_<id>`. Client join/leave test room requests must verify test ownership. Emit after persistence:
- `telemetry_reading` to `test_<testId>`
- `active_test_stream` to `user_<userId>`
Payload includes testId/motorId/motorCode/source/vibration/temperature/timestamp/analysis/stats.
Emit `test_status_change` for stop/finish; `mqtt_status` on broker connection changes. Never broadcast private telemetry globally. Frontend keeps rolling 40-point chart and unregisters handlers on unmount.

## Frontend routing and services

Use React Router: public `/`, `/login`, `/register`; protected shell routes `/dashboard`, `/tests/new`, `/history`, `/history/:id`, `/compare`, `/reports`; unknown path redirects to `/`. AuthContext exposes user/loading/login/register/logout. API helper uses relative `/api`, fetch credentials include, JSON handling and useful normalized errors. Socket singleton connects same origin with credentials/reconnection. Vite proxies `/api` and `/socket.io` to configured backend port. Tailwind defines industrial palette and font families; CSS includes base/reset, focus-visible, reduced motion and print styles.

## Environment variables

Read/validate config centrally:
- `PORT` (5000), `NODE_ENV`, `FRONTEND_URL` (local Vite origin)
- `DATABASE_URL` required; user's own PostgreSQL URL
- `JWT_SECRET` required, long random secret; no weak production default
- `COOKIE_SECURE` true for HTTPS production, false local HTTP
- `MQTT_BROKER_URL`, `MQTT_USERNAME`, `MQTT_PASSWORD`, `MQTT_TOPIC` (default above)
- `SIMULATION_INTERVAL_MS` (1000 default; positive sensible range)
Examples must use placeholders such as `postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/motorvibe`, `replace-with-a-long-random-secret`, and `mqtt://YOUR_BROKER_HOST:1883`. Explain each variable and never print actual secrets. Fail clearly if PostgreSQL/JWT config is absent.

## Package scripts, tests, and acceptance

Provide real root scripts: `dev`, `dev:backend`, `dev:frontend`, `build`, `lint`, `test`, `db:init`. Use pnpm workspace commands consistently; lint must actually lint/check syntax, not merely print “passed”.

Jest/Supertest should cover health analysis boundaries/fault rules, MQTT payload validation, registration/password hash/duplicate/login/logout/me, protected ownership, motor creation, test start/stop/finish, simulated persistence, history filters, compare, and health. Use an isolated test PostgreSQL database and test-only credentials. Never clean arbitrary databases. MQTT tests should use injected/mocked client or validation logic rather than requiring a public broker; document manual broker check separately.

README must explain architecture, exact dependency/runtime versions used, setup on Windows/macOS/Linux, own PostgreSQL/database URL, environment copies, schema init, scripts and URLs, API overview, cookies, simulation rules, MQTT setup and hardware prerequisites, tests/build and troubleshooting. Explain that backend + PostgreSQL are required for account/data features, and hardware mode additionally requires broker/network/device.

Acceptance checklist:
1. Fresh install works with documented Node/package manager and independent PostgreSQL DB.
2. Schema init repeatable; missing DB/schema errors actionable, no fallback storage.
3. Register/login/logout/session refresh works with httpOnly cookie.
4. Add motor, run simulation, see live chart/metrics and persisted telemetry.
5. Stop/finish and inspect history/detail/compare/print.
6. Cross-user REST and socket access is denied.
7. Hardware view waits for real MQTT packets and persists only actual packets as hardware.
8. Dashboard has only capability cards, no test result data.
9. Responsive UI has clear loading/empty/error states.
10. Lint, tests, production build pass. Report any unverified external service honestly.

## Source-derived caveats to resolve during recreation

The reference implementation has these discrepancies or limitations; treat them as known gaps, not working guarantees:
- The frontend requests `/api/hardware/status`, while mounting the dashboard router under `/api/hardware` combines with its internal `/hardware/status` route and produces `/api/hardware/hardware/status`. Make client, mount, and route agree on the documented `/api/hardware/status` contract.
- The hardware README advertises tighter bounds (0–50 mm/s and -40–150°C) than the MQTT validator (0–100 and -40–200). Pick one documented, validated range and use it consistently in firmware guidance, tests, and backend.
- The current simulation uses process-local intervals; a backend restart loses active loops although test rows remain in PostgreSQL. Either document this limitation or recover/stop orphaned running tests at startup.
- MQTT device status is based on received packets, not an actual ESP32 connection handshake. Treat last-seen as a heartbeat estimate, and avoid implying broker connectivity proves a device is connected.
- The reference can route incoming MQTT by motor code even though codes are only unique per user. Resolve device-to-owner routing unambiguously and avoid globally broadcasting idle readings containing asset identifiers.
- The hardware mode can create a running test while the broker is offline; keep the UI honest and waiting. Never synthesize readings to make the view look active.
- The report page contains fixed threshold text and “ISO”/sign-off presentation. Align numbers with the analysis configuration and clearly label the document as a generated, preliminary report without implying certification or an actual sign-off.
- Existing backend `lint` only prints a success message, so replace it with a real check. The current integration tests require PostgreSQL and start server/MQTT code when imported; configure a clearly isolated test database and avoid depending on an external broker for automated tests.
- The reference returns JWT tokens in JSON as well as setting a cookie and accepts Bearer tokens. Prefer cookie-only browser handling; if Bearer support is retained for tools, document it and never store browser tokens in localStorage.

## Implementation order

Inspect tools/workspace; scaffold workspaces and examples; implement schema/db config; backend auth/ownership/routes/errors; analysis and tests; simulation; MQTT and Socket.IO; frontend shell/services/pages; README and hardware guide; install dependencies; initialize the user's database; lint, test, build, and fix issues. Finish with a concise report of files created, commands run, results, and external requirements still outstanding.
