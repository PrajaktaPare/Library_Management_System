import fs from 'fs/promises';
import path from 'path';
import transporter from '../config/mailer.config.js';
import logger from './logger.service.js';

// load email template
const loadTemplate = async fileName => {
  try {
    // build template path
    const templatePath = path.join(process.cwd(), 'src', 'templates', fileName);

    // read template
    return await fs.readFile(templatePath, 'utf8');
  } catch (error) {
    // log error
    logger.error('TEMPLATE LOAD ERROR', error);
    throw error;
  }
};

// send verification email
export const sendVerificationEmail = async ({ email, firstName, verificationLink }) => {
  try {
    // load template
    let html = await loadTemplate('auth_email_verification.html');

    // replace variables
    html = html.replaceAll('{{first_name}}', firstName);
    html = html.replaceAll('{{link}}', verificationLink);

    // send email
    const info = await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: 'Verify Your Account',
      html,
    });

    // log success
    logger.info(`VERIFICATION EMAIL SENT : ${email}`);

    return info;
  } catch (error) {
    // log error
    logger.error('VERIFICATION EMAIL ERROR', error);
    throw error;
  }
};

// send forgot password email
export const sendForgotPasswordEmail = async ({ email, firstName, resetLink }) => {
  try {
    // load template
    let html = await loadTemplate('forgot_password_email.html');

    // replace variables
    html = html.replaceAll('{{first_name}}', firstName);
    html = html.replaceAll('{{link}}', resetLink);

    // send email
    const info = await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: 'Reset Password',
      html,
    });

    // log success
    logger.info(`FORGOT PASSWORD EMAIL SENT : ${email}`);

    return info;
  } catch (error) {
    // log error
    logger.error('FORGOT PASSWORD EMAIL ERROR', error);
    throw error;
  }
};

// send password updated email
export const sendPasswordUpdatedEmail = async ({ email, firstName }) => {
  try {
    // load template
    let html = await loadTemplate('success_update_password.html');

    // replace variables
    html = html.replaceAll('{{first_name}}', firstName);

    // send email
    const info = await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: 'Password Updated Successfully',
      html,
    });

    // log success
    logger.info(`PASSWORD UPDATED EMAIL SENT : ${email}`);

    return info;
  } catch (error) {
    // log error
    logger.error('PASSWORD UPDATED EMAIL ERROR', error);
    throw error;
  }
};

// send book issued email
export const sendBookIssuedEmail = async ({
  email,
  studentName,
  bookTitle,
  bookAuthor,
  bookIsbn,
  bookCategory,
  issueDate,
  dueDate,
  finePerDay,
}) => {
  try {
    // load template
    let html = await loadTemplate('book_issued_email.html');

    // replace variables
    html = html.replaceAll('{{student_name}}', studentName);
    html = html.replaceAll('{{book_title}}', bookTitle);
    html = html.replaceAll('{{book_author}}', bookAuthor);
    html = html.replaceAll('{{book_isbn}}', bookIsbn);
    html = html.replaceAll('{{book_category}}', bookCategory);
    html = html.replaceAll('{{issue_date}}', issueDate);
    html = html.replaceAll('{{due_date}}', dueDate);
    html = html.replaceAll('{{fine_per_day}}', String(finePerDay));

    // send email
    const info = await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: 'Book Request Approved',
      html,
    });

    // log success
    logger.info(`BOOK ISSUED EMAIL SENT : ${email}`);

    return info;
  } catch (error) {
    // log error
    logger.error('BOOK ISSUED EMAIL ERROR', error);
    throw error;
  }
};

// send book rejected email
export const sendBookRejectedEmail = async ({
  email,
  studentName,
  bookTitle,
  bookAuthor,
  bookIsbn,
  bookCategory,
  requestedAt,
  rejectedAt,
  reason,
}) => {
  try {
    // load template
    let html = await loadTemplate('book_rejected_email.html');

    // replace variables
    html = html.replaceAll('{{student_name}}', studentName);
    html = html.replaceAll('{{book_title}}', bookTitle);
    html = html.replaceAll('{{book_author}}', bookAuthor);
    html = html.replaceAll('{{book_isbn}}', bookIsbn);
    html = html.replaceAll('{{book_category}}', bookCategory);
    html = html.replaceAll('{{requested_at}}', requestedAt);
    html = html.replaceAll('{{rejected_at}}', rejectedAt);
    html = html.replaceAll('{{reason}}', reason);

    // send email
    const info = await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: 'Book Request Rejected',
      html,
    });

    // log success
    logger.info(`BOOK REJECTED EMAIL SENT : ${email}`);

    return info;
  } catch (error) {
    // log error
    logger.error('BOOK REJECTED EMAIL ERROR', error);
    throw error;
  }
};
