import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
import routes from './src/routes/index.js';
import { connectDB } from './src/config/db.js';
import logger from './src/services/logger.service.js';

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

// Get server port from environment variables
const port = process.env.PORT || 3000;
/*
  Purpose:
    Handle all unhandled application errors globally

  Parameters:
    - error: Contains error details
    - req: Contains request data
    - res: Contains response methods
    - next: Pass control to next middleware

  Returns:
    - Sends JSON error response
*/
app.use((error, req, res, next) => {
  logger.error('GLOBAL ERROR', error);

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
  });
});

/*
  Purpose: Connect database and start Express server
  Parameters: None
  Returns: Starts application server
*/
const startServer = async () => {
  try {
    await connectDB();

    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });
  } catch (error) {
    logger.error('SERVER START ERROR', error);
  }
};

startServer();
