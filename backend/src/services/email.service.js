import fs from 'fs/promises';
import path from 'path';

import transporter from '../config/mailer.js';
import logger from './logger.service.js';

// load html template
const loadTemplate = async fileName => {
  const templatePath = path.join(process.cwd(), 'src', 'utils', 'templates', fileName);

  return await fs.readFile(templatePath, 'utf8');
};

// replace variables
const replaceVariables = (html, variables) => {
  Object.entries(variables).forEach(([key, value]) => {
    html = html.replaceAll(`{{${key}}}`, value || '');
  });

  return html;
};

// send email helper
const sendTemplateEmail = async ({ to, subject, template, variables }) => {
  try {
    // load template
    let html = await loadTemplate(template);

    // replace variables
    html = replaceVariables(html, variables);

    // send email
    const info = await transporter.sendMail({
      from: process.env.MAIL_USER,
      to,
      subject,
      html,
    });

    logger.info(`EMAIL SENT : ${info.messageId}`);

    return info;
  } catch (error) {
    logger.error('EMAIL SEND ERROR', error);

    throw error;
  }
};

// verification email
export const sendVerificationEmail = async ({ to, first_name, link }) => {
  return await sendTemplateEmail({
    to,
    subject: 'Verify Your Account',
    template: 'auth.email.verification.html',
    variables: {
      first_name,
      link,
    },
  });
};

// forgot password email
export const sendForgotPasswordEmail = async ({ to, first_name, link }) => {
  return await sendTemplateEmail({
    to,
    subject: 'Reset Password',
    template: 'forgot.password.email.html',
    variables: {
      first_name,
      link,
    },
  });
};

// password updated email
export const sendPasswordUpdatedEmail = async ({ to, first_name }) => {
  return await sendTemplateEmail({
    to,
    subject: 'Password Updated Successfully',
    template: 'success.update.password.html',
    variables: {
      first_name,
    },
  });
};

// book issued email
export const sendBookIssuedEmail = async ({
  to,
  studentName,
  bookTitle,
  bookAuthor,
  bookIsbn,
  bookCategory,
  issueDate,
  dueDate,
  finePerDay,
}) => {
  return await sendTemplateEmail({
    to,
    subject: 'Book Request Approved',
    template: 'book.issued.email.html',
    variables: {
      student_name: studentName,
      book_title: bookTitle,
      book_author: bookAuthor,
      book_isbn: bookIsbn,
      book_category: bookCategory,
      issue_date: issueDate,
      due_date: dueDate,
      fine_per_day: finePerDay,
    },
  });
};

/* =========================================
   GENERIC EMAIL DISPATCHER
========================================= */

/**
 * Generic email dispatcher used by auth and user controllers.
 * Routes to specific email functions based on type.
 * @param {Object} options - Email options.
 * @param {string} options.to - Recipient email.
 * @param {string} options.first_name - Recipient first name.
 * @param {string} options.link - Action link (optional).
 * @param {string} options.type - Email type identifier.
 */
export const sendEmail = async ({ to, first_name, link, type }) => {
  switch (type) {
    case 'verification':
      return await sendVerificationEmail({ to, first_name, link });

    case 'forgot_password':
      return await sendForgotPasswordEmail({ to, first_name, link });

    case 'password_success':
      return await sendPasswordUpdatedEmail({ to, first_name });

    default:
      throw new Error(`UNKNOWN_EMAIL_TYPE: ${type}`);
  }
};

// book rejected email
export const sendBookRejectedEmail = async ({
  to,
  studentName,
  bookTitle,
  bookAuthor,
  bookIsbn,
  bookCategory,
  requestedAt,
  rejectedAt,
  reason,
}) => {
  return await sendTemplateEmail({
    to,
    subject: 'Book Request Rejected',
    template: 'book.rejected.email.html',
    variables: {
      student_name: studentName,
      book_title: bookTitle,
      book_author: bookAuthor,
      book_isbn: bookIsbn,
      book_category: bookCategory,
      requested_at: requestedAt,
      rejected_at: rejectedAt,
      reason,
    },
  });
};
