CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_code VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(64) NOT NULL,
  location VARCHAR(255),
  status VARCHAR(32) NOT NULL DEFAULT 'offline',
  last_ping TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT devices_status_check CHECK (status IN ('online', 'offline', 'error'))
);

CREATE TABLE IF NOT EXISTS sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  co2 NUMERIC,
  gas_level NUMERIC,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp
  ON sensor_readings (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_timestamp
  ON sensor_readings (device_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS system_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_active BOOLEAN NOT NULL DEFAULT FALSE,
  valve_open BOOLEAN NOT NULL DEFAULT FALSE,
  alarm_active BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(32) NOT NULL,
  message TEXT NOT NULL,
  metric VARCHAR(64),
  value NUMERIC,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  CONSTRAINT alerts_type_check CHECK (type IN ('warning', 'danger', 'system_error'))
);

INSERT INTO users (user_code, email)
SELECT 'AGAS-2026-001', 'demo@agas.local'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE user_code = 'AGAS-2026-001');

INSERT INTO system_state (fan_active, valve_open, alarm_active)
SELECT FALSE, FALSE, FALSE
WHERE NOT EXISTS (SELECT 1 FROM system_state);
