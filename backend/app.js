import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
import routes from './src/routes/index.js';
import { connectDB } from './src/config/db.config.js';
import logger from './src/services/logger.service.js';

// load environment variables
dotenv.config();

const app = express();

// Convert JSON request body into JavaScript object
app.use(express.json());

// Convert form data into JavaScript object for accessing through req.body
app.use(express.urlencoded({ extended: true }));

// Parse client cookies and store them in req.cookies
app.use(cookieParser());

// Register all application routes
app.use('/', routes);

/**
 * Handle all unhandled application errors globally.
 * @param {Error} error - Error object.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * @returns {Response} JSON error response.
 */
app.use((error, req, res, next) => {
  // log error
  logger.error('GLOBAL ERROR', error);

  // return error response
  return res.status(error.statusCode || 500).json({
    success_flag: false,
    message: error.message || 'Internal Server Error',
  });
});

/**
 * Connect database and start Express server.
 * @returns {Promise<void>} Starts server after successful DB connection.
 */
const startServer = async () => {
  try {
    // connect database
    await connectDB();

    // start express server
    app.listen(process.env.PORT || 3000, () => {
      logger.info(`Server running on port ${process.env.PORT || 3000}`);
    });
  } catch (error) {
    // log server error
    logger.error('SERVER START ERROR', error);
  }
};

// start application
startServer();
