require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const { bootstrapDatabase } = require('./db');
const { setIO } = require('./services/realtimeService');
const { registerSocketHandlers } = require('./sockets');
const v1Routes = require('./routes/v1Routes');
const legacyRoutes = require('./routes/legacyRoutes');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
setIO(io);
registerSocketHandlers(io);

app.get('/', (req, res) => {
  res.send('Smart Safety API is running');
});

app.use(legacyRoutes);
app.use('/v1', v1Routes);

bootstrapDatabase()
  .catch((error) => {
    console.error('Database bootstrap failed:', error.message);
  })
  .finally(() => {
    server.listen(PORT, HOST, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  });