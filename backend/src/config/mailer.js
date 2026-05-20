import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

//debug mail credentials
console.log(process.env.MAIL_PASS);
console.log(process.env.MAIL_USER);

//create transporter
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT) || 587,
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

//verify mail connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Mailer connection failed:', error.message);
  } else {
    console.log('Mailer is ready to send emails');
  }
});

//export transporter
export default transporter;
