let ioRef = null;

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function setIO(io) {
  ioRef = io;
}

function getRealtimeReading(gasData) {
  return {
    sensorId: gasData?.sensorId || gasData?.deviceName || 'Main Sensor Hub',
    co2: toNumber(gasData?.co2 ?? gasData?.readings?.co2),
    gas_level: toNumber(gasData?.gas_level ?? gasData?.readings?.gas_level)
  };
}

function getSystemStatusFromValues(reading) {
  if (!reading) return 'safe';

  if ((reading.co2 || 0) >= 1500 || (reading.gas_level || 0) >= 20) {
    return 'danger';
  }
  if ((reading.co2 || 0) >= 1000 || (reading.gas_level || 0) >= 10) {
    return 'warning';
  }

  return 'safe';
}

function broadcastSensorUpdate(gasData, source, meta = {}) {
  if (!ioRef) {
    console.warn('⚠️ Cannot broadcast: Socket.IO not initialized');
    return;
  }

  const reading = getRealtimeReading(gasData);
  const systemStatus = meta.systemStatus || getSystemStatusFromValues(reading);

  const connectedClients = ioRef.engine?.clientsCount || 0;
  console.log(`📡 Broadcasting to ${connectedClients} connected clients`);

  ioRef.emit('gas-data-update', {
    timestamp: new Date(),
    data: gasData,
    source
  });

  ioRef.emit('sensor_update', {
    type: 'sensor_update',
    payload: {
      co2: reading.co2,
      gas_level: reading.gas_level,
      system_status: systemStatus,
      control_state: meta.controlState || null
    }
  });

  ioRef.emit('device_status_update', {
    type: 'device_status_update',
    payload: {
      sensorId: reading.sensorId,
      device_status: 'online',
      system_status: systemStatus,
      last_ping: new Date()
    }
  });

  console.log(`✅ Broadcast complete: ${reading.sensorId} | CO2: ${reading.co2} | Gas: ${reading.gas_level} | Status: ${systemStatus}`);
}

function broadcastGasAlert(alertData) {
  if (!ioRef) {
    console.warn('⚠️ Cannot broadcast gas alert: Socket.IO not initialized');
    return;
  }

  const connectedClients = ioRef.engine?.clientsCount || 0;
  console.log(`🚨 Broadcasting GAS ALERT to ${connectedClients} clients`);

  ioRef.emit('gas-alert', {
    title: alertData.message || 'Gas alert detected',
    co2: alertData.co2 || 0,
    timestamp: new Date().toISOString()
  });

  console.log(`✅ Gas alert broadcast: ${alertData.message}`);
}

module.exports = {
  setIO,
  broadcastSensorUpdate,
  broadcastGasAlert,
  getRealtimeReading,
  getSystemStatusFromValues
};
