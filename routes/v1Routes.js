const express = require('express');
const { requireDatabase } = require('../middlewares/requireDatabase');
const {
  getCurrentMetrics,
  getMetricsHistory,
  getControlState,
  toggleControl,
  getAlerts,
  resolveAlert
} = require('../services/safetyService');

const router = express.Router();

router.use(requireDatabase);

router.get('/metrics/current', async (req, res) => {
  try {
    const data = await getCurrentMetrics();
    return res.json({ status: 'success', data });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

router.get('/metrics/history', async (req, res) => {
  try {
    const data = await getMetricsHistory(req.query.period || '24h', req.query.interval || '5m');
    return res.json({ status: 'success', data });
  } catch (error) {
    if (error.message === 'INVALID_PERIOD') {
      return res.status(400).json({ status: 'error', message: 'Invalid period. Use 1h, 24h, 7d, or 30d.' });
    }
    if (error.message === 'INVALID_INTERVAL') {
      return res.status(400).json({ status: 'error', message: 'Invalid interval. Use 5m, 1h, or 1d.' });
    }
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

router.get('/control/state', async (req, res) => {
  try {
    const data = await getControlState();
    return res.json({ status: 'success', data });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

router.post('/control/toggle', async (req, res) => {
  try {
    const result = await toggleControl(req.body?.device, req.body?.state);
    return res.json({
      status: 'success',
      message: result.message,
      data: result.data
    });
  } catch (error) {
    if (error.message === 'INVALID_DEVICE') {
      return res.status(400).json({ status: 'error', message: 'device must be one of fan, valve, alarm' });
    }
    if (error.message === 'INVALID_STATE') {
      return res.status(400).json({ status: 'error', message: 'state must be a boolean' });
    }
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

router.get('/alerts', async (req, res) => {
  try {
    const data = await getAlerts(req.query.status || 'all', req.query.limit || 50);
    return res.json({ status: 'success', data });
  } catch (error) {
    if (error.message === 'INVALID_ALERT_STATUS') {
      return res.status(400).json({ status: 'error', message: 'status must be active, resolved, or all' });
    }
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

router.post('/alerts/:id/resolve', async (req, res) => {
  try {
    await resolveAlert(req.params.id);
    return res.json({ status: 'success', message: 'Alert resolved successfully' });
  } catch (error) {
    if (error.message === 'ALERT_NOT_FOUND') {
      return res.status(404).json({ status: 'error', message: 'Alert not found' });
    }
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
