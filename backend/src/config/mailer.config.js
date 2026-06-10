import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import logger from './../services/logger.service.js';

// load environment variables
dotenv.config();

/**
 * Create Nodemailer transporter for sending emails.
 * Uses SMTP configuration from environment variables.
 */
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT) || 587,
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Verify mail server connection on application startup.
 * Logs connection status in console.
 */
transporter.verify((error, success) => {
  if (error) {
    logger.error(`Mailer connection failed: ${error.message}`);
  } else {
    logger.info('Mailer is ready to send emails');
  }
});

// export transporter
export default transporter;
