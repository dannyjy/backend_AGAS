const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

// Track connected clients
const connectedClients = new Set();

// Socket.IO connection handling
io.on('connection', (socket) => {
  connectedClients.add(socket.id);
  console.log(`Client connected: ${socket.id}`);
  console.log(`Total connected clients: ${connectedClients.size}`);

  // Emit connection confirmation to client
  socket.emit('connected', {
    message: 'Successfully connected to the server',
    clientId: socket.id
  });

  // Listen for client requests to fetch gas data from API
  socket.on('fetch-gas-data', async (data) => {
    try {
      console.log('Fetching gas data from API...');
      // Replace with your actual gas data API endpoint
      const apiUrl = data?.apiUrl || 'https://api.example.com/gas-data';
      
      const response = await axios.get(apiUrl);
      const gasData = response.data;
      
      console.log('Gas data fetched from API:', gasData);
      
      // Broadcast to all connected clients
      io.emit('gas-data-update', {
        timestamp: new Date(),
        data: gasData,
        source: 'api'
      });
      
      // Confirm to requesting client
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

  // Handle disconnection
  socket.on('disconnect', () => {
    connectedClients.delete(socket.id);
    console.log(`Client disconnected: ${socket.id}`);
    console.log(`Total connected clients: ${connectedClients.size}`);
  });
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post("/api/gas-data", (req, res) => {
  const gasData = req.body; // Assuming the gas data is sent in the request body
  console.log("Received gas data:", gasData);
  
  // Broadcast the received gas data to all connected Socket.IO clients
  io.emit('gas-data-update', {
    timestamp: new Date(),
    data: gasData,
    source: 'hardware'
  });
  
  res.send("Gas data received and broadcast to clients!");
});

// Optional: Endpoint to trigger gas data fetch and broadcast
app.get('/api/fetch-gas-data', async (req, res) => {
  try {
    const apiUrl = req.query.apiUrl || 'https://api.example.com/gas-data';
    console.log(`Fetching gas data from: ${apiUrl}`);
    
    const response = await axios.get(apiUrl);
    const gasData = response.data;
    
    // Broadcast to all connected Socket.IO clients
    io.emit('gas-data-update', {
      timestamp: new Date(),
      data: gasData,
      source: 'api'
    });
    
    res.json({
      message: 'Gas data fetched and broadcast successfully',
      data: gasData
    });
  } catch (error) {
    console.error('Error fetching gas data from API:', error.message);
    res.status(500).json({
      message: 'Failed to fetch gas data from API',
      error: error.message
    });
  }
});

server.listen(3000,'0.0.0.0', () => {
  console.log('Server running at http://localhost:3000');
});