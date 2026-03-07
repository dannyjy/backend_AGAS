const express = require('express');
const { hasDbConfig, isDbReady, pool } = require('../db');
const { broadcastSensorUpdate, getRealtimeReading, getSystemStatusFromValues } = require('../services/realtimeService');
const { fetchExternalGasData, persistReading, getControlState } = require('../services/safetyService');

const router = express.Router();

// Health check endpoint for mobile app diagnostics
router.get('/health', async (req, res) => {
  const timestamp = new Date().toISOString();
  let databaseStatus = false;

  try {
    if (pool && isDbReady()) {
      await pool.query('SELECT 1');
      databaseStatus = true;
    }
  } catch (error) {
    console.error('Database health check failed:', error.message);
  }

  const status = databaseStatus ? 'ok' : 'degraded';
  const statusCode = databaseStatus ? 200 : 503;

  return res.status(statusCode).json({
    status,
    timestamp,
    api: true,
    socketIo: true,
    database: databaseStatus,
    version: '1.0.0'
  });
});

// Socket.IO diagnostics endpoint
router.get('/socket-status', (req, res) => {
  const io = req.app.get('io');
  
  if (!io) {
    return res.json({
      socketIo: false,
      message: 'Socket.IO not initialized',
      connectedClients: 0
    });
  }

  const connectedClients = io.engine?.clientsCount || 0;
  const sockets = [];
  
  io.sockets.sockets.forEach((socket) => {
    sockets.push({
      id: socket.id,
      connected: socket.connected
    });
  });

  return res.json({
    socketIo: true,
    connectedClients,
    clients: sockets,
    message: `${connectedClients} client(s) connected`
  });
});

router.post('/api/gas-data', async (req, res) => {
  try {
    const gasData = req.body;
    await persistReading(gasData);

    const reading = getRealtimeReading(gasData);
    const systemStatus = getSystemStatusFromValues(reading);
    const controlState = hasDbConfig && isDbReady() ? await getControlState() : null;

    broadcastSensorUpdate(gasData, 'hardware', {
      systemStatus,
      controlState
    });

    return res.json({
      message: 'Gas data received and broadcast to clients!'
    });
  } catch (error) {
    console.error('Failed to process hardware gas data:', error.message);
    return res.status(500).json({
      message: 'Failed to process gas data',
      error: error.message
    });
  }
});

router.get('/api/fetch-gas-data', async (req, res) => {
  try {
    const gasData = await fetchExternalGasData(req.query.apiUrl);
    await persistReading(gasData);

    const reading = getRealtimeReading(gasData);
    const systemStatus = getSystemStatusFromValues(reading);
    const controlState = hasDbConfig && isDbReady() ? await getControlState() : null;

    broadcastSensorUpdate(gasData, 'api', {
      systemStatus,
      controlState
    });

    return res.json({
      message: 'Gas data fetched and broadcast successfully',
      data: gasData
    });
  } catch (error) {
    console.error('Error fetching gas data from API:', error.message);
    return res.status(500).json({
      message: 'Failed to fetch gas data from API',
      error: error.message
    });
  }
});

module.exports = router;
