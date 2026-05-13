// Import Express framework
const express = require('express');
// Import CORS middleware for cross-origin requests
const cors = require('cors');
// Import Helmet for setting secure HTTP headers
const helmet = require('helmet');
// Import cookie-parser to parse cookies from requests
const cookieParser = require('cookie-parser');
// Enable async error handling in Express routes
require('express-async-errors');

// Import application route definitions
const apiRoutes = require('./routes');
// Import custom middleware functions
const { errorMiddleware, notFoundMiddleware, loggerMiddleware } = require('./middleware');

// Create Express application instance
const app = express();

// Apply Helmet middleware for security headers
app.use(helmet());

// Configure CORS to allow frontend origin and credentials
app.use(cors({
  origin: function(origin, callback) {
    // List of allowed origins for API access
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'http://localhost:8000',
      'http://127.0.0.1:8000',
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    // In development mode, allow all origins
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
      return;
    }

    // In production, only allow listed origins
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies up to 10MB
app.use(express.json({ limit: '10mb' }));
// Parse URL-encoded bodies up to 10MB
app.use(express.urlencoded({ limit: '10mb', extended: true }));
// Parse cookies from incoming requests
app.use(cookieParser());
// Apply HTTP request logging middleware
app.use(loggerMiddleware);

// Mount all API routes under /api/v1 prefix
app.use('/api/v1', apiRoutes);

// Catch-all 404 handler for unmatched routes
app.use(notFoundMiddleware);

// Global error handling middleware (must be registered last)
app.use(errorMiddleware);

// Export the configured app instance
module.exports = app;
