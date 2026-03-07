const { hasDbConfig, isDbReady } = require('../db');
const { broadcastSensorUpdate, getRealtimeReading, getSystemStatusFromValues } = require('../services/realtimeService');
const { fetchExternalGasData, persistReading, getControlState, toggleControl } = require('../services/safetyService');

function registerSocketHandlers(io) {
  const connectedClients = new Set();

  io.on('connection', (socket) => {
    connectedClients.add(socket.id);
    console.log(`Client connected: ${socket.id}`);
    console.log(`Total connected clients: ${connectedClients.size}`);

    socket.emit('connected', {
      message: 'Successfully connected to the server',
      clientId: socket.id
    });

    socket.on('fetch-gas-data', async (data) => {
      try {
        const gasData = await fetchExternalGasData(data?.apiUrl);
        await persistReading(gasData);

        const reading = getRealtimeReading(gasData);
        const systemStatus = getSystemStatusFromValues(reading);
        const controlState = hasDbConfig && isDbReady() ? await getControlState() : null;

        broadcastSensorUpdate(gasData, 'api', {
          systemStatus,
          controlState
        });

        socket.emit('fetch-success', {
          message: 'Gas data fetched and broadcast successfully',
          data: gasData
        });
      } catch (error) {
        console.error('Error fetching gas data from API:', error.message);
        socket.emit('fetch-error', {
          message: 'Failed to fetch gas data from API',
          error: error.message
        });
      }
    });

    // Mobile app fan control
    socket.on('fan-control', async (data) => {
      if (!hasDbConfig || !isDbReady()) {
        socket.emit('control-error', {
          message: 'Database not available',
          device: 'fan'
        });
        return;
      }

      try {
        const state = data?.state === 'on' || data?.state === true;
        const result = await toggleControl('fan', state);
        
        // Broadcast state change to all clients
        io.emit('control-state-update', {
          device: 'fan',
          state: state ? 'on' : 'off',
          timestamp: new Date().toISOString()
        });

        socket.emit('control-success', {
          message: result.message,
          device: 'fan',
          state: state ? 'on' : 'off'
        });
      } catch (error) {
        console.error('Error controlling fan:', error.message);
        socket.emit('control-error', {
          message: error.message,
          device: 'fan'
        });
      }
    });

    // Mobile app valve control
    socket.on('valve-control', async (data) => {
      if (!hasDbConfig || !isDbReady()) {
        socket.emit('control-error', {
          message: 'Database not available',
          device: 'valve'
        });
        return;
      }

      try {
        const state = data?.state === 'open' || data?.state === true;
        const result = await toggleControl('valve', state);
        
        // Broadcast state change to all clients
        io.emit('control-state-update', {
          device: 'valve',
          state: state ? 'open' : 'close',
          timestamp: new Date().toISOString()
        });

        socket.emit('control-success', {
          message: result.message,
          device: 'valve',
          state: state ? 'open' : 'close'
        });
      } catch (error) {
        console.error('Error controlling valve:', error.message);
        socket.emit('control-error', {
          message: error.message,
          device: 'valve'
        });
      }
    });

    socket.on('disconnect', () => {
      connectedClients.delete(socket.id);
    });
  });
}

module.exports = {
  registerSocketHandlers
};
