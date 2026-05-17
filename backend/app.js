import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import routes from './src/routes/index.js';

import { connectDB } from './src/config/db.js';

import logger from './src/utils/logger.js';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Parse incoming JSON data
app.use(express.json());

// Parse URL encoded form data
app.use(express.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());

// Log request details
app.use((req, res, next) => {
  logger.info(`METHOD: ${req.method}`);

  logger.info(`URL: ${req.url}`);

  logger.info(`HEADERS: ${JSON.stringify(req.headers)}`);

  next();
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Register all application routes
app.use('/', routes);

// Handle global application errors
app.use((error, req, res, next) => {
  logger.error('GLOBAL ERROR', error);

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
  });
});

// Application port
const port = process.env.PORT || 3000;

/* =========================================
   FUNCTION: startServer

   PURPOSE:
   Connect database
   and start express server

   PARAMETER:
   - none

   RETURN:
   - starts server
========================================= */
const startServer = async () => {
  try {
    // Connect database
    await connectDB();

    // Start server
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });
  } catch (error) {
    logger.error('SERVER START ERROR', error);
  }
};

// Execute server startup
startServer();
