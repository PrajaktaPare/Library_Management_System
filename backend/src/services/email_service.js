import transporter from '../config/mailer.js';

import ejs from 'ejs';
import fs from 'fs';
import path from 'path';

import logger from '../utils/logger.js';

export const sendVerificationEmail = async (email, link) => {
  try {

    // path of html file
    const templatePath = path.join(
      process.cwd(),
      'src',
      'utils',
      'templates',
      'email_template.html'
    );

    // read html file
    let htmlContent = fs.readFileSync(templatePath, 'utf-8');

    logger.info('EMAIL TEMPLATE LOADED');

    // replace placeholder with actual link
    htmlContent = htmlContent.replace('{{LINK}}', link);

    logger.info('EMAIL LINK INSERTED INTO TEMPLATE');

    // send mail
    const info = await transporter.sendMail({
      from: `"Demo App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email',
      html: htmlContent,
    });

    logger.info(`EMAIL SENT SUCCESSFULLY: ${info.messageId}`);

    return info;

  } catch (error) {

    logger.error('SMTP ERROR IN EMAIL SERVICE', error);

    throw new Error('EMAIL_SEND_FAILED');
  }
};