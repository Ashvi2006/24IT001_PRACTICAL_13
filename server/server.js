
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const NodeCache = require('node-cache');

dotenv.config();

const connectDB = require('./config/db');
const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Load Event Listener
require('./listener');

const app = express();
const PORT = process.env.PORT || 5000;

// In-Memory Cache
const taskCache = new NodeCache({
  stdTTL: 60
});

// Request Logging Middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();

  console.log('REQUEST START:', req.method, req.url);

  res.on('finish', () => {
    console.log(
      'REQUEST COMPLETE:',
      req.method,
      req.url,
      res.statusCode,
      timestamp
    );
  });

  next();
});

// Core Middleware
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Student Portfolio API is running',
    timestamp: new Date().toISOString()
  });
});

// Cache Test Route
app.get('/api/cache-test', (req, res) => {
  const cachedData = taskCache.get('test');

  if (cachedData) {
    console.log('Cache HIT');

    return res.json({
      message: 'Data returned from cache',
      data: cachedData
    });
  }

  console.log('Cache MISS');

  const data = {
    message: 'This data was generated and stored in cache',
    timestamp: new Date().toISOString()
  };

  taskCache.set('test', data);

  res.json({
    message: 'Data stored in cache',
    data: data
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route ' + req.originalUrl + ' not found'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error: ' + err.message);
  console.error(err.stack);

  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});


 // Start Server
if (require.main === module) {
  async function startServer() {
    try {
      await connectDB();

      console.log('MongoDB connection established');

      app.listen(PORT, '0.0.0.0', () => {
        console.log('Server running on http://localhost:' + PORT);
        console.log(
          'Environment: ' +
          (process.env.NODE_ENV || 'development')
        );
      });
    } catch (error) {
      console.error('Failed to start server:', error.message);
      process.exit(1);
    }
  }

  startServer();
}

module.exports = app;
