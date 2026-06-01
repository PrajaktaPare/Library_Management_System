import fs from 'fs/promises';
import path from 'path';

import transporter from '../config/mailer.config.js';
import logger from './logger.service.js';

// email subjects and template mapping
const emailTemplates  = {
  verification: {
    subject: 'Verify Your Account',
    template: 'auth.email.verification.html',
  },

  forgot_password: {
    subject: 'Reset Password',
    template: 'forgot.password.email.html',
  },

  password_updated: {
    subject: 'Password Updated Successfully',
    template: 'success.update.password.html',
  },

  book_issued: {
    subject: 'Book Request Approved',
    template: 'book.issued.email.html',
  },

  book_rejected: {
    subject: 'Book Request Rejected',
    template: 'book.rejected.email.html',
  },
};

/**
 * Load html email template file.
 * @param {string} fileName - Template file name.
 * @returns {Promise<string>} Html template content.
 */
const loadTemplate = async fileName => {
  try {
    // create absolute template path
    const templatePath = path.join(process.cwd(), 'src', 'utils', 'templates', fileName);

    // read html template file
    return await fs.readFile(templatePath, 'utf8');
  } catch (error) {
    // log template load error
    logger.error('TEMPLATE LOAD ERROR', error);

    throw error;
  }
};

/**
 * Replace template placeholders with actual values.
 * @param {string} html - Html template string.
 * @param {Object} variables - Dynamic template variables.
 * @returns {string} Updated html template.
 */
const replaceVariables = (html, variables) => {
  Object.entries(variables).forEach(([key, value]) => {
   html = html.replaceAll(`{{${key}}}`, String(value ?? ''));
  });

  return html;
};

/**
 * Send email using configured template.
 * @param {Object} options - Email options.
 * @param {string} options.type - Email type key.
 * @param {string} options.to - Recipient email address.
 * @param {Object} options.variables - Template variables.
 * @returns {Promise<Object>} Nodemailer response info.
 */
export const sendEmail = async ({ type, to, variables = {} }) => {
  try {
    // validate email type exists
    if (!emailTemplates [type]) {
      throw new Error(`UNKNOWN_EMAIL_TYPE: ${type}`);
    }

    // get email configuration
    const { subject, template } = emailTemplates [type];

    // load html template
    let html = await loadTemplate(template);

    // replace template variables
    html = replaceVariables(html, variables);

    // send email using nodemailer
    const info = await transporter.sendMail({
      from: process.env.MAIL_USER, // sender email
      to, // recipient email
      subject, // email subject
      html, // html body content
    });

    // log success response
    logger.info(`EMAIL SENT : ${info.messageId}`);

    return info;
  } catch (error) {
    // log email sending error
    logger.error('EMAIL SEND ERROR', error);

    throw error;
  }
};