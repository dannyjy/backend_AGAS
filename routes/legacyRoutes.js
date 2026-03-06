const express = require('express');
const { hasDbConfig, isDbReady } = require('../db');
const { broadcastSensorUpdate, getRealtimeReading, getSystemStatusFromValues } = require('../services/realtimeService');
const { fetchExternalGasData, persistReading, getControlState } = require('../services/safetyService');

const router = express.Router();

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
