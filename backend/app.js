import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import routes from './src/routes/index.js';
import { connectDB } from './src/config/db.js';
import logger from './src/utils/logger.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/*
DEBUGGING MIDDLEWARE (NOW WITH WINSTON)
*/
app.use((req, res, next) => {
  logger.info(`METHOD: ${req.method}`);
  logger.info(`URL: ${req.url}`);
  logger.info(`HEADERS: ${JSON.stringify(req.headers)}`);
  next();
});

/*
STATIC FOLDER
*/
app.use('/uploads', express.static('uploads'));

/*
ALL ROUTES
*/
app.use('/', routes);

/*
GLOBAL ERROR HANDLER (UNCOMMENTED + UPDATED)
*/
app.use((error, req, res, next) => {
  logger.error("GLOBAL ERROR", error);

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal Server Error",
  });
});

const port = process.env.PORT || 3000;

/*
START SERVER
*/
const startServer = async () => {
  try {
    await connectDB();

    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });
  } catch (error) {
    logger.error("SERVER START ERROR", error);
  }
};

startServer();