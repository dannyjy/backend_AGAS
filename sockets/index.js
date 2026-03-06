const { hasDbConfig, isDbReady } = require('../db');
const { broadcastSensorUpdate, getRealtimeReading, getSystemStatusFromValues } = require('../services/realtimeService');
const { fetchExternalGasData, persistReading, getControlState } = require('../services/safetyService');

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

    socket.on('disconnect', () => {
      connectedClients.delete(socket.id);
    });
  });
}

module.exports = {
  registerSocketHandlers
};
