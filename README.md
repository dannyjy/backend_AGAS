# AGAS Backend (Hackathon Demo)

Real-time gas monitoring backend using Node.js, Express, Socket.IO, and PostgreSQL.

This version is configured for demo use:
- no authentication required
- CO2 and gas level only
- default demo user created automatically

## Current Features

- Arduino data ingestion via REST
- Real-time WebSocket broadcast to frontend
- PostgreSQL persistence for readings, alerts, and control state
- Alert generation based on thresholds
- Manual control endpoints (fan, valve, alarm)
- Metrics endpoints for current and historical data

## Tech Stack

- `express`
- `socket.io`
- `pg`
- `axios`
- `cors`
- `dotenv`

## Project Structure

```text
backend/
  config/database.js
  db/schema.sql
  db.js
  middlewares/
  routes/
  services/
  sockets/
  server.js
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` in the project root:

```env
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5433/smart_safety
DB_SSL=false
DEFAULT_USER_ID=AGAS-2026-001
```

3. Start server:

```bash
npm start
```

Server URL: `http://localhost:3000`

## ☁️ Cloud Deployment

### DigitalOcean (Recommended for Students)

**Quick Start:**
1. Sign up at [digitalocean.com](https://www.digitalocean.com)
2. Get $200 free credit: [GitHub Student Pack](https://education.github.com/pack)
3. Deploy: [cloud.digitalocean.com/apps/new](https://cloud.digitalocean.com/apps/new)

📖 See [DIGITALOCEAN_QUICK_START.md](./DIGITALOCEAN_QUICK_START.md) - 5-minute setup!
📖 See [DIGITALOCEAN_DEPLOYMENT.md](./DIGITALOCEAN_DEPLOYMENT.md) - Full guide

**Cost**: ~$12/month (FREE for 16+ months with student credits!)

---

### Azure (Alternative)

**Quick Start:**
```powershell
azd auth login
azd env set DATABASE_ADMIN_PASSWORD "YourSecurePassword123!"
azd up
```

📖 See [AZURE_QUICK_START.md](./AZURE_QUICK_START.md) for a 5-minute deployment guide.
📖 See [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md) for complete documentation.

**Note**: Azure for Students may have region restrictions. See [AZURE_REGIONS.md](./AZURE_REGIONS.md).

## Data Model (Sensor Input)

Only these sensor fields are used now:

```json
{
  "sensorId": "SENSOR-001",
  "co2": 920,
  "gas_level": 6
}
```

Supported payload styles:
- flat payload: `co2`, `gas_level`
- nested payload: `{ readings: { co2, gas_level } }`

## Alert Thresholds

- `danger` when `co2 >= 1500` or `gas_level >= 20`
- `warning` when `co2 >= 1000` or `gas_level >= 10`
- otherwise `safe`

## REST API

### Base

- `GET /` -> health text response

### Arduino / Hardware

- `POST /api/gas-data`
- `GET /api/fetch-gas-data?apiUrl=...`

Example:

```bash
curl -X POST http://localhost:3000/api/gas-data \
  -H "Content-Type: application/json" \
  -d '{"sensorId":"SENSOR-001","co2":920,"gas_level":6}'
```

### Frontend (`/v1`)

- `GET /v1/metrics/current`
- `GET /v1/metrics/history?period=24h&interval=5m`
- `GET /v1/control/state`
- `POST /v1/control/toggle`
- `GET /v1/alerts?status=all&limit=50`
- `POST /v1/alerts/:id/resolve`

Toggle body example:

```json
{
  "device": "fan",
  "state": true
}
```

## WebSocket Events

Connect client:

```javascript
const socket = io('http://localhost:3000');
```

Events from server:
- `connected`
- `gas-data-update`
- `sensor_update`
- `fetch-success`
- `fetch-error`

## Quick Smoke Test

1. Send sample reading:

```bash
curl -X POST http://localhost:3000/api/gas-data \
  -H "Content-Type: application/json" \
  -d '{"sensorId":"SENSOR-001","co2":920,"gas_level":6}'
```

2. Fetch latest metrics:

```bash
curl http://localhost:3000/v1/metrics/current
```

Expected `readings` includes only:
- `co2`
- `gas_level`

## Demo Mode Notes

- Authentication is disabled intentionally for hackathon demo.
- Default user code seeded: `AGAS-2026-001`.
- `v1` routes require database availability.

## Additional Docs

- `HACKATHON_QUICK_START.md`
- `ARDUINO_API_SPEC.md`
- `FRONTEND_API_SPEC.md`
- `DATABASE_SETUP.md`
- `DOCUMENTATION_INDEX.md`

## License

ISC