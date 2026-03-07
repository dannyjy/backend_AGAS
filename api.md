# AGAS Backend Technical Documentation (v1)

Date: 2026-03-07

This document is the single source of truth for the current AGAS backend implementation.

## 1) System Overview

AGAS backend is a Node.js real-time gas monitoring API. It supports:
- Sensor ingestion via REST
- Real-time updates via Socket.IO
- Alert generation based on CO2 and gas thresholds
- Device control state (fan, valve, alarm)
- PostgreSQL persistence for historical and operational data

## 2) Technology Stack

- Runtime: Node.js (CommonJS)
- HTTP Server: Express `^5.2.1`
- Realtime: Socket.IO `^4.8.3`
- Database: PostgreSQL via `pg ^8.20.0`
- HTTP client for external ingest: `axios ^1.6.0`
- Middleware: `cors ^2.8.6`, `dotenv ^17.3.1`
- Dev tooling: `nodemon ^3.1.14`

## 3) Base URLs

- Production: `https://agas-backend-agtlp.ondigitalocean.app`
- Local (default): `http://localhost:3000`

## 4) Authentication

- Current mode: no auth required (hackathon/demo mode)
- All endpoints are currently accessible without bearer tokens.

## 5) Database Schema Used

The backend uses existing tables only (no table modifications required):
- `users`
- `devices`
- `sensor_readings`
- `system_state`
- `alerts`

## 6) REST API Contract

### 6.1 `GET /`
Purpose:
- Basic server liveness text endpoint.

Response:
```json
"Smart Safety API is running"
```

### 6.2 `GET /health`
Purpose:
- API, Socket.IO, and database diagnostics.

Response example:
```json
{
  "status": "ok",
  "timestamp": "2026-03-07T10:20:00.000Z",
  "api": true,
  "socketIo": true,
  "database": true,
  "version": "1.0.0"
}
```

Status codes:
- `200` healthy
- `503` degraded/unhealthy (usually DB not ready)

### 6.3 `POST /api/gas-data`
Purpose:
- Receive sensor payload
- Persist reading (if DB ready)
- Broadcast updates to connected clients

Required headers:
- `Content-Type: application/json`

Accepted body shapes (current behavior):

Flat:
```json
{
  "sensorId": "dev-001",
  "co2": 420,
  "gas_level": 3.1
}
```

Nested:
```json
{
  "sensorId": "dev-001",
  "readings": {
    "co2": 420,
    "gas_level": 3.1
  }
}
```

Notes:
- `sensorId` fallback: `deviceName`, then `"Main Sensor Hub"`
- `co2`/`gas_level` are parsed to numbers when possible

Success response:
```json
{
  "message": "Gas data received and broadcast to clients!"
}
```

Status codes:
- `200` success
- `500` server-side processing error

### 6.4 `GET /api/fetch-gas-data?apiUrl=...`
Purpose:
- Fetch sensor payload from external API
- Persist and broadcast as realtime update

Success response:
```json
{
  "message": "Gas data fetched and broadcast successfully",
  "data": {}
}
```

Status codes:
- `200` success
- `500` external fetch/processing error

### 6.5 `GET /v1/metrics/current`
Purpose:
- Get latest reading and computed system status

Response:
```json
{
  "status": "success",
  "data": {
    "system_status": "safe",
    "timestamp": "2026-03-07T10:15:00.000Z",
    "readings": {
      "co2": 420,
      "gas_level": 3.1
    }
  }
}
```

### 6.6 `GET /v1/metrics/history?period=24h&interval=5m`
Purpose:
- Aggregated historical readings for charts

Query params:
- `period`: `1h`, `24h`, `7d`, `30d`
- `interval`: `5m`, `1h`, `1d`

Response:
```json
{
  "status": "success",
  "data": [
    {
      "timestamp": "2026-03-07T10:00:00.000Z",
      "co2": 417.5,
      "gas_level": 2.9
    }
  ]
}
```

Error responses:
- `400` invalid period/interval
- `500` server error

### 6.7 `GET /v1/control/state`
Purpose:
- Get latest fan/valve/alarm state

Response:
```json
{
  "status": "success",
  "data": {
    "fan_active": false,
    "valve_open": false,
    "alarm_active": false,
    "last_updated": "2026-03-07T10:00:00.000Z"
  }
}
```

### 6.8 `POST /v1/control/toggle`
Purpose:
- Set `fan`, `valve`, or `alarm` boolean state

Request body:
```json
{
  "device": "fan",
  "state": true
}
```

Response:
```json
{
  "status": "success",
  "message": "Fan state updated successfully",
  "data": {
    "fan_active": true,
    "valve_open": false,
    "alarm_active": false,
    "last_updated": "2026-03-07T10:00:00.000Z"
  }
}
```

Errors:
- `400` invalid device or state
- `500` server error

### 6.9 `GET /v1/alerts?status=all&limit=50`
Purpose:
- Retrieve alerts list

Query params:
- `status`: `active`, `resolved`, `all`
- `limit`: number up to 200

Response:
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "type": "warning",
      "message": "Elevated CO2 level detected",
      "metric": "co2",
      "value": 1200,
      "resolved": false,
      "created_at": "2026-03-07T10:00:00.000Z",
      "resolved_at": null
    }
  ]
}
```

### 6.10 `POST /v1/alerts/:id/resolve`
Purpose:
- Mark alert as resolved

Response:
```json
{
  "status": "success",
  "message": "Alert resolved successfully"
}
```

Errors:
- `404` alert not found
- `500` server error

## 7) Socket.IO Contract

Connection:
- URL: same backend origin (production or local)
- Example: `io("https://agas-backend-agtlp.ondigitalocean.app")`
- Supported transports: websocket and polling

### 7.1 Server -> Client Events

`connected`
```json
{
  "message": "Successfully connected to the server",
  "clientId": "socket-id"
}
```

`gas-data-update`
```json
{
  "timestamp": "2026-03-07T10:15:00.000Z",
  "data": {
    "sensorId": "dev-001",
    "co2": 420,
    "gas_level": 3.1
  },
  "source": "hardware"
}
```

`sensor_update`
```json
{
  "type": "sensor_update",
  "payload": {
    "co2": 420,
    "gas_level": 3.1,
    "system_status": "safe",
    "control_state": {
      "fan_active": false,
      "valve_open": false,
      "alarm_active": false,
      "last_updated": "2026-03-07T10:15:00.000Z"
    }
  }
}
```

`device_status_update`
```json
{
  "type": "device_status_update",
  "payload": {
    "sensorId": "dev-001",
    "device_status": "online",
    "system_status": "safe",
    "last_ping": "2026-03-07T10:15:00.000Z"
  }
}
```

`gas-alert`
```json
{
  "title": "Gas leak detected",
  "co2": 1600,
  "timestamp": "2026-03-07T10:16:00.000Z"
}
```

`control-state-update`
```json
{
  "device": "fan",
  "state": "on",
  "timestamp": "2026-03-07T10:16:00.000Z"
}
```

`control-success`
```json
{
  "message": "Fan state updated successfully",
  "device": "fan",
  "state": "on"
}
```

`control-error`
```json
{
  "message": "Database not available",
  "device": "fan"
}
```

`fetch-success` / `fetch-error`
- Response events to `fetch-gas-data`

### 7.2 Client -> Server Events

`fetch-gas-data`
```json
{
  "apiUrl": "https://example.com/api/gas-data"
}
```

`fan-control`
```json
{
  "state": "on"
}
```
Accepted equivalents for `state`: `"on"`, `"off"`, `true`, `false`

`valve-control`
```json
{
  "state": "open"
}
```
Accepted equivalents for `state`: `"open"`, `"close"`, `true`, `false`

## 8) Data You Send vs Data You Receive

### Data the client sends
- `POST /api/gas-data` body: sensor payload (`co2`, `gas_level`, optional sensor identity)
- `POST /v1/control/toggle` body: `{ device, state }`
- Socket `fan-control`: `{ state }`
- Socket `valve-control`: `{ state }`
- Socket `fetch-gas-data`: `{ apiUrl }`

### Data the client receives
- REST responses from all endpoints in section 6
- Realtime events from section 7.1
- Alert/status/control updates in near real-time

## 9) Field Compatibility Notes

Current backend parsing supports:
- Sensor ID keys: `sensorId`, `deviceName`
- Gas keys: `co2`, `gas_level`
- Nested readings: `readings.co2`, `readings.gas_level`

If mobile uses aliases such as `gasLevel` or `sensor_id`, the app should map them before sending, or include both key styles in payload.

## 10) Alert Logic and Thresholds

- `danger` if `co2 >= 1500` or `gas_level >= 20`
- `warning` if `co2 >= 1000` or `gas_level >= 10`
- `safe` otherwise

When danger/warning is detected:
- alert row is inserted into `alerts`
- latest `system_state` is updated
- `gas-alert` socket event is emitted

## 11) Configuration Details

### 11.1 Required environment variables

```env
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgresql://.../...
NODE_ENV=production
```

Optional:
```env
DB_SSL=false
DEFAULT_USER_ID=AGAS-2026-001
```

### 11.2 Local run

```bash
npm install
npm start
```

### 11.3 Deployment details

- Platform: DigitalOcean App Platform
- Auto deploy: enabled from `main` branch
- Production URL: `https://agas-backend-agtlp.ondigitalocean.app`

Important:
- Keep `DATABASE_URL` in DigitalOcean app secrets/config.
- Do not commit database credentials to git.

## 12) Error Handling Summary

Common error patterns:
- REST returns `{ status: "error", message: "..." }` for v1 routes
- Legacy routes return `{ message: "...", error: "..." }` on failures
- Socket control/fetch errors emit `control-error` or `fetch-error`

## 13) Quick API Smoke Tests

```bash
curl https://agas-backend-agtlp.ondigitalocean.app/health
```

```bash
curl -X POST https://agas-backend-agtlp.ondigitalocean.app/api/gas-data \
  -H "Content-Type: application/json" \
  -d '{"sensorId":"dev-001","co2":420,"gas_level":3.1}'
```

```bash
curl https://agas-backend-agtlp.ondigitalocean.app/v1/metrics/current
```

```bash
curl "https://agas-backend-agtlp.ondigitalocean.app/v1/metrics/history?period=24h&interval=5m"
```

```bash
curl https://agas-backend-agtlp.ondigitalocean.app/v1/control/state
```

```bash
curl -X POST https://agas-backend-agtlp.ondigitalocean.app/v1/control/toggle \
  -H "Content-Type: application/json" \
  -d '{"device":"fan","state":true}'
```

```bash
curl "https://agas-backend-agtlp.ondigitalocean.app/v1/alerts?status=active&limit=50"
```