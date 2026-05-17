import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Debug environment variables
console.log(process.env.MAIL_USER);
console.log(process.env.MAIL_PASS);

/* =========================================
   MAIL TRANSPORTER

   PURPOSE:
   Create nodemailer transporter
   for sending emails
========================================= */
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,

  port: parseInt(process.env.MAIL_PORT),

  secure: false,

  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/* =========================================
   VERIFY MAIL CONNECTION

   PURPOSE:
   Verify SMTP connection on startup
========================================= */
transporter.verify((error, success) => {
  if (error) {
    console.error('MAILER CONNECTION FAILED:', error.message);
  } else {
    console.log('MAILER IS READY TO SEND EMAILS');
  }
});

export default transporter;
