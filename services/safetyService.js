const axios = require('axios');
const { pool, isDbReady } = require('../db');
const { broadcastGasAlert } = require('./realtimeService');

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeReadingPayload(input) {
  const src = input && typeof input === 'object' ? input : {};
  const readings = src.readings && typeof src.readings === 'object' ? src.readings : src;

  return {
    sensorId: src.sensorId || src.deviceName || 'Main Sensor Hub',
    co2: toNumber(readings.co2),
    gas_level: toNumber(readings.gas_level)
  };
}

function getSystemStatus(reading) {
  if (!reading) return 'safe';

  if ((reading.co2 || 0) >= 1500 || (reading.gas_level || 0) >= 20) {
    return 'danger';
  }
  if ((reading.co2 || 0) >= 1000 || (reading.gas_level || 0) >= 10) {
    return 'warning';
  }
  return 'safe';
}

async function ensureDeviceByName(client, deviceName) {
  const safeName = deviceName || 'Main Sensor Hub';
  const existing = await client.query('SELECT id FROM devices WHERE name = $1 LIMIT 1', [safeName]);

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const inserted = await client.query(
    `
      INSERT INTO devices (name, type, location, status, last_ping)
      VALUES ($1, 'sensor_hub', 'Unassigned', 'online', NOW())
      RETURNING id
    `,
    [safeName]
  );

  return inserted.rows[0].id;
}

async function maybeCreateAlerts(client, reading) {
  const alertsToInsert = [];
  const alertsToEmit = [];

  if ((reading.co2 || 0) >= 1500) {
    alertsToInsert.push(['danger', 'High CO2 level detected', 'co2', reading.co2]);
    alertsToEmit.push({ message: 'Gas leak detected', co2: reading.co2 });
  } else if ((reading.co2 || 0) >= 1000) {
    alertsToInsert.push(['warning', 'Elevated CO2 level detected', 'co2', reading.co2]);
    alertsToEmit.push({ message: 'Elevated CO2 level detected', co2: reading.co2 });
  }

  if ((reading.gas_level || 0) >= 20) {
    alertsToInsert.push(['danger', 'High gas level detected', 'gas_level', reading.gas_level]);
    if (alertsToEmit.length === 0) {
      alertsToEmit.push({ message: 'Gas leak detected', co2: reading.co2 || 0 });
    }
  } else if ((reading.gas_level || 0) >= 10) {
    alertsToInsert.push(['warning', 'Elevated gas level detected', 'gas_level', reading.gas_level]);
  }

  for (const item of alertsToInsert) {
    await client.query(
      'INSERT INTO alerts (type, message, metric, value, resolved) VALUES ($1, $2, $3, $4, false)',
      item
    );
  }

  // Emit gas-alert for mobile app notifications
  for (const alert of alertsToEmit) {
    broadcastGasAlert(alert);
  }

  const status = getSystemStatus(reading);
  const alarmActive = status !== 'safe';

  const latestState = await client.query(
    `
      SELECT fan_active, valve_open
      FROM system_state
      ORDER BY updated_at DESC
      LIMIT 1
    `
  );

  const fanActive = status === 'danger' ? true : (latestState.rows[0]?.fan_active || false);
  const valveOpen = status === 'danger' ? true : (latestState.rows[0]?.valve_open || false);

  await client.query(
    `
      INSERT INTO system_state (fan_active, valve_open, alarm_active, updated_at)
      VALUES ($1, $2, $3, NOW())
    `,
    [fanActive, valveOpen, alarmActive]
  );
}

async function persistReading(payload) {
  if (!pool || !isDbReady()) {
    return;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const normalized = normalizeReadingPayload(payload);
    const deviceId = await ensureDeviceByName(client, normalized.sensorId);

    await client.query(
      `
        UPDATE devices
        SET status = 'online', last_ping = NOW()
        WHERE id = $1
      `,
      [deviceId]
    );

    await client.query(
      `
        INSERT INTO sensor_readings (device_id, co2, gas_level, timestamp)
        VALUES ($1, $2, $3, NOW())
      `,
      [deviceId, normalized.co2, normalized.gas_level]
    );

    await maybeCreateAlerts(client, normalized);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function fetchExternalGasData(apiUrl) {
  const targetUrl = apiUrl || 'https://api.example.com/gas-data';
  const response = await axios.get(targetUrl);
  return response.data;
}

async function getCurrentMetrics() {
  const latest = await pool.query(
    `
      SELECT
        sr.timestamp,
        sr.co2,
        sr.gas_level
      FROM sensor_readings sr
      ORDER BY sr.timestamp DESC
      LIMIT 1
    `
  );

  if (latest.rows.length === 0) {
    return {
      system_status: 'safe',
      timestamp: null,
      readings: {}
    };
  }

  const reading = latest.rows[0];
  return {
    system_status: getSystemStatus(reading),
    timestamp: reading.timestamp,
    readings: {
      co2: toNumber(reading.co2),
      gas_level: toNumber(reading.gas_level)
    }
  };
}

async function getMetricsHistory(period = '24h', interval = '5m') {
  const periodMap = {
    '1h': '1 hour',
    '24h': '24 hours',
    '7d': '7 days',
    '30d': '30 days'
  };
  const intervalSecondsMap = {
    '5m': 300,
    '1h': 3600,
    '1d': 86400
  };

  if (!periodMap[period]) {
    throw new Error('INVALID_PERIOD');
  }

  if (!intervalSecondsMap[interval]) {
    throw new Error('INVALID_INTERVAL');
  }

  const rows = await pool.query(
    `
      SELECT
        to_timestamp(
          floor(extract(epoch from sr.timestamp) / $2) * $2
        ) AS timestamp,
        AVG(sr.co2)::float AS co2,
        AVG(sr.gas_level)::float AS gas_level
      FROM sensor_readings sr
      WHERE sr.timestamp >= NOW() - ($1::interval)
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    [periodMap[period], intervalSecondsMap[interval]]
  );

  return rows.rows;
}

async function getControlState() {
  const state = await pool.query(
    `
      SELECT fan_active, valve_open, alarm_active, updated_at
      FROM system_state
      ORDER BY updated_at DESC
      LIMIT 1
    `
  );

  const current = state.rows[0] || {
    fan_active: false,
    valve_open: false,
    alarm_active: false,
    updated_at: null
  };

  return {
    fan_active: current.fan_active,
    valve_open: current.valve_open,
    alarm_active: current.alarm_active,
    last_updated: current.updated_at
  };
}

async function toggleControl(device, state) {
  if (!['fan', 'valve', 'alarm'].includes(device)) {
    throw new Error('INVALID_DEVICE');
  }
  if (typeof state !== 'boolean') {
    throw new Error('INVALID_STATE');
  }

  const latest = await pool.query(
    `
      SELECT fan_active, valve_open, alarm_active
      FROM system_state
      ORDER BY updated_at DESC
      LIMIT 1
    `
  );

  const current = latest.rows[0] || {
    fan_active: false,
    valve_open: false,
    alarm_active: false
  };

  const updated = {
    fan_active: current.fan_active,
    valve_open: current.valve_open,
    alarm_active: current.alarm_active
  };

  if (device === 'fan') updated.fan_active = state;
  if (device === 'valve') updated.valve_open = state;
  if (device === 'alarm') updated.alarm_active = state;

  const inserted = await pool.query(
    `
      INSERT INTO system_state (fan_active, valve_open, alarm_active, updated_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING fan_active, valve_open, alarm_active, updated_at
    `,
    [updated.fan_active, updated.valve_open, updated.alarm_active]
  );

  const row = inserted.rows[0];
  return {
    message: `${device[0].toUpperCase()}${device.slice(1)} state updated successfully`,
    data: {
      fan_active: row.fan_active,
      valve_open: row.valve_open,
      alarm_active: row.alarm_active,
      last_updated: row.updated_at
    }
  };
}

async function getAlerts(status = 'all', limit = 50) {
  if (!['active', 'resolved', 'all'].includes(status)) {
    throw new Error('INVALID_ALERT_STATUS');
  }

  const safeLimit = Math.min(Number(limit || 50), 200);
  const where = status === 'active' ? 'WHERE resolved = false' : status === 'resolved' ? 'WHERE resolved = true' : '';

  const query = `
    SELECT id, type, message, metric, value, resolved, created_at, resolved_at
    FROM alerts
    ${where}
    ORDER BY created_at DESC
    LIMIT $1
  `;

  const alerts = await pool.query(query, [safeLimit]);
  return alerts.rows;
}

async function resolveAlert(id) {
  const result = await pool.query(
    `
      UPDATE alerts
      SET resolved = true, resolved_at = NOW()
      WHERE id = $1
      RETURNING id
    `,
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error('ALERT_NOT_FOUND');
  }
}

module.exports = {
  persistReading,
  fetchExternalGasData,
  getCurrentMetrics,
  getMetricsHistory,
  getControlState,
  toggleControl,
  getAlerts,
  resolveAlert,
  getSystemStatus
};
