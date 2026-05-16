import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log(process.env.MAIL_PASS);
console.log(process.env.MAIL_USER);
// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});
// verify connection once on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Mailer connection failed:', error.message);
  } else {
    console.log('Mailer is ready to send emails');
  }
});

export default transporter;
