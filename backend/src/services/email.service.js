import fs from 'fs';
import path from 'path';
import transporter from '../config/mailer.js';
import logger from './logger.service.js';

/*
send verification email
params: email,link,first_name
return: nodemailer response
*/
export const sendVerificationEmail = async (email, link, first_name) => {
  try {
    logger.info('EMAIL DEBUG', { email, link, first_name });
    logger.info(`SENDING VERIFICATION EMAIL TO ${email}`);

    //template path
    const templatePath = path.join(
      process.cwd(),
      'src',
      'utils',
      'templates',
      'auth.email.verification.html'
    );

    //read template
    let htmlContent = fs.readFileSync(templatePath, 'utf-8');

    logger.info('EMAIL TEMPLATE LOADED SUCCESSFULLY');

    //replace placeholders
    htmlContent = htmlContent.replaceAll('{{USERNAME}}', first_name);
    htmlContent = htmlContent.replaceAll('{{LINK}}', link);

    logger.info('EMAIL TEMPLATE VARIABLES REPLACED');

    //send email
    const info = await transporter.sendMail({
      from: `"Library Management System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email',
      html: htmlContent,
    });

    logger.info(`VERIFICATION EMAIL SENT SUCCESSFULLY TO ${email}`);
    logger.info(`EMAIL MESSAGE ID: ${info.messageId}`);

    return info;
  } catch (error) {
    logger.error('SMTP ERROR IN EMAIL SERVICE', error);
    throw new Error('EMAIL_SEND_FAILED');
  }
};
