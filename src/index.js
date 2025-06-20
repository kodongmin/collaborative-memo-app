require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');

// Validate required environment variables
const requiredEnvVars = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_S3_BUCKET'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`Error: ${varName} is not set in environment variables`);
    process.exit(1);
  }
});

const authRoutes = require('./routes/auth');
const memoRoutes = require('./routes/memos');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "x-auth-token"]
  }
});

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Middleware
app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-auth-token']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/memos', memoRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join-memo', (memoId) => {
    socket.join(`memo-${memoId}`);
  });

  socket.on('memo-update', (data) => {
    socket.to(`memo-${data.memoId}`).emit('memo-updated', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 