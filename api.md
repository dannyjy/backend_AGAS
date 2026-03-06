# Smart Safety System API Documentation

## Overview
This document outlines the backend architecture, database schema, and API endpoints for the Smart Safety System dashboard. The system manages IoT sensor data (temperature, humidity, CO2, etc.) and provides real-time alerts and control mechanisms for attached devices (fans, valves).

---

## Database Schema (PostgreSQL/Supabase)

### 1. `devices` table
Stores registered IoT devices and their current connection status.
- `id` (uuid, primary key)
- `name` (varchar) - e.g., "Main Sensor Hub"
- `type` (varchar) - "sensor_hub", "actuator"
- `location` (varchar) - e.g., "Kitchen", "Basement"
- `status` (varchar) - "online", "offline", "error"
- `last_ping` (timestamp)
- `created_at` (timestamp)

### 2. `sensor_readings` table
Time-series data for all sensor metrics.
- `id` (uuid, primary key)
- `device_id` (uuid, foreign key to devices)
- `co2` (numeric, ppm)
- `gas_level` (numeric, % LEL)
- `timestamp` (timestamp, indexed for time-series queries)

### 3. `system_state` table
Current state of controllable actuators (fans, valves).
- `id` (uuid, primary key)
- `fan_active` (boolean)
- `valve_open` (boolean)
- `alarm_active` (boolean)
- `updated_at` (timestamp)
- `updated_by` (uuid, foreign key to users, nullable if automated)

### 4. `alerts` table
Record of system warnings and danger states.
- `id` (uuid, primary key)
- `type` (varchar) - "warning", "danger", "system_error"
- `message` (text)
- `metric` (varchar) - "co2", "temperature", "gas", etc.
- `value` (numeric)
- `resolved` (boolean)
- `created_at` (timestamp)
- `resolved_at` (timestamp, nullable)

---

## API Endpoints (REST)

Base URL: `https://api.smartsafety.example.com/v1`

### Authentication
All endpoints require a Bearer token in the Authorization header.
`Authorization: Bearer <your_jwt_token>`

---

### Sensors & Metrics

#### GET `/metrics/current`
Returns the latest sensor readings and overall system status.

**Response:**
```json
{
  "status": "success",
  "data": {
    "system_status": "safe", // "safe", "warning", "danger"
    "timestamp": "2026-03-06T14:32:00Z",
    "readings": {
      "temperature": 24.5,
      "humidity": 45.2,
      "co2": 420.0,
      "gas_level": 0.0,
      "pressure": 1013.2
    }
  }
}
```

#### GET `/metrics/history`
Returns historical data for charts.
**Query Params:** `period` (1h, 24h, 7d, 30d), `interval` (5m, 1h, 1d)

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "timestamp": "2026-03-06T14:00:00Z",
      "temperature": 24.1,
      "humidity": 45.0,
      "co2": 415.0
    },
    {
      "timestamp": "2026-03-06T14:05:00Z",
      "temperature": 24.3,
      "humidity": 45.1,
      "co2": 418.0
    }
    // ... more data points
  ]
}
```

---

### System Control

#### GET `/control/state`
Returns the current state of connected actuators.

**Response:**
```json
{
  "status": "success",
  "data": {
    "fan_active": false,
    "valve_open": true,
    "alarm_active": false,
    "last_updated": "2026-03-06T12:00:00Z"
  }
}
```

#### POST `/control/toggle`
Toggles a specific system actuator.

**Request:**
```json
{
  "device": "fan", // "fan" or "valve"
  "state": true // true (ON/OPEN) or false (OFF/CLOSED)
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Fan state updated successfully",
  "data": {
    "fan_active": true,
    "valve_open": true
  }
}
```

---

### Alerts & Notifications

#### GET `/alerts`
Returns active and historical alerts.
**Query Params:** `status` (active, resolved, all), `limit` (default: 50)

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "a1b2c3d4",
      "type": "warning",
      "message": "Elevated CO2 levels detected",
      "metric": "co2",
      "value": 1200.5,
      "resolved": false,
      "created_at": "2026-03-06T14:20:00Z"
    },
    {
      "id": "e5f6g7h8",
      "type": "danger",
      "message": "High temperature detected in Server Room",
      "metric": "temperature",
      "value": 35.2,
      "resolved": true,
      "created_at": "2026-03-05T09:15:00Z",
      "resolved_at": "2026-03-05T09:45:00Z"
    }
  ]
}
```

#### POST `/alerts/:id/resolve`
Marks an alert as resolved.

**Response:**
```json
{
  "status": "success",
  "message": "Alert resolved successfully"
}
```

---

### WebSockets (Real-time updates)
The application connects to a WebSocket at `wss://api.smartsafety.example.com/ws` for real-time sensor streams rather than polling.

**Example incoming message:**
```json
{
  "type": "sensor_update",
  "payload": {
    "temperature": 24.6,
    "humidity": 45.3,
    "co2": 422.0
  }
}
```