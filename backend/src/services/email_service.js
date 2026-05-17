import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import transporter from '../config/mailer.js';
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

/* =========================================
   FUNCTION: sendBookIssuedEmail

   PURPOSE:
   Send book issued confirmation email
   with due date and fine info

   PARAMETER:
   - { to, studentName, bookTitle, bookAuthor,
       bookIsbn, bookCategory, issueDate,
       dueDate, finePerDay }
========================================= */
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
  try {
    const templatePath = path.join(
      process.cwd(),
      'src',
      'utils',
      'templates',
      'book_issued_template.html'
    );

    let html = fs.readFileSync(templatePath, 'utf-8');

    html = html
      .replace(/{{STUDENT_NAME}}/g, studentName)
      .replace(/{{BOOK_TITLE}}/g, bookTitle)
      .replace(/{{BOOK_AUTHOR}}/g, bookAuthor)
      .replace(/{{BOOK_ISBN}}/g, bookIsbn)
      .replace(/{{BOOK_CATEGORY}}/g, bookCategory)
      .replace(/{{ISSUE_DATE}}/g, issueDate)
      .replace(/{{DUE_DATE}}/g, dueDate)
      .replace(/{{FINE_PER_DAY}}/g, finePerDay);

    const info = await transporter.sendMail({
      from: `"Library Management System" <${process.env.EMAIL_USER}>`,
      to,
      subject: `📚 Book Issued: ${bookTitle} — Return by ${dueDate}`,
      html,
    });

    logger.info(`BOOK ISSUED EMAIL SENT: ${info.messageId} → ${to}`);

    return info;
  } catch (error) {
    logger.error('BOOK ISSUED EMAIL ERROR', error);

    throw new Error('EMAIL_SEND_FAILED');
  }
};

/* =========================================
   FUNCTION: sendBookRejectedEmail

   PURPOSE:
   Send book request rejection email

   PARAMETER:
   - { to, studentName, bookTitle, bookAuthor,
       bookIsbn, bookCategory, requestedAt,
       rejectedAt, reason }
========================================= */
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
  try {
    const templatePath = path.join(
      process.cwd(),
      'src',
      'utils',
      'templates',
      'book_rejected_template.html'
    );

    let html = fs.readFileSync(templatePath, 'utf-8');

    html = html
      .replace(/{{STUDENT_NAME}}/g, studentName)
      .replace(/{{BOOK_TITLE}}/g, bookTitle)
      .replace(/{{BOOK_AUTHOR}}/g, bookAuthor)
      .replace(/{{BOOK_ISBN}}/g, bookIsbn)
      .replace(/{{BOOK_CATEGORY}}/g, bookCategory)
      .replace(/{{REQUESTED_AT}}/g, requestedAt)
      .replace(/{{REJECTED_AT}}/g, rejectedAt)
      .replace(/{{REJECTION_REASON}}/g, reason);

    const info = await transporter.sendMail({
      from: `"Library Management System" <${process.env.EMAIL_USER}>`,
      to,
      subject: `❌ Book Request Rejected: ${bookTitle}`,
      html,
    });

    logger.info(`BOOK REJECTED EMAIL SENT: ${info.messageId} → ${to}`);

    return info;
  } catch (error) {
    logger.error('BOOK REJECTED EMAIL ERROR', error);

    throw new Error('EMAIL_SEND_FAILED');
  }
};

/* =========================================
   FUNCTION: sendBookReturnedEmail

   PURPOSE:
   Send book return confirmation email.
   Shows fine details if overdue.

   PARAMETER:
   - { to, studentName, bookTitle, bookAuthor,
       bookCategory, issueDate, dueDate,
       returnedAt, overdueDays, fineAmount,
       finePerDay }
========================================= */
export const sendBookReturnedEmail = async ({
  to,
  studentName,
  bookTitle,
  bookAuthor,
  bookCategory,
  issueDate,
  dueDate,
  returnedAt,
  overdueDays,
  fineAmount,
  finePerDay,
}) => {
  try {
    const templatePath = path.join(
      process.cwd(),
      'src',
      'utils',
      'templates',
      'book_returned_template.html'
    );

    let html = fs.readFileSync(templatePath, 'utf-8');

    // Build fine section dynamically
    const fineSection =
      fineAmount > 0
        ? `
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:#fce4ec; border:1px solid #f8bbd0; border-radius:8px; margin-bottom:20px;">
          <tr>
            <td style="padding:18px 20px;">
              <p style="margin:0 0 10px 0; font-size:15px; font-weight:bold; color:#c62828;">
                ⚠️ Late Return Fine
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:14px; color:#888; padding-bottom:8px;">Overdue by</td>
                  <td style="font-size:14px; font-weight:bold; color:#333; padding-bottom:8px;">${overdueDays} day${overdueDays > 1 ? 's' : ''}</td>
                </tr>
                <tr>
                  <td style="font-size:14px; color:#888; padding-bottom:8px;">Fine rate</td>
                  <td style="font-size:14px; color:#333; padding-bottom:8px;">₹${finePerDay} per day</td>
                </tr>
                <tr>
                  <td style="font-size:16px; font-weight:bold; color:#c62828;">Total Fine</td>
                  <td style="font-size:18px; font-weight:bold; color:#b71c1c;">₹${fineAmount}</td>
                </tr>
              </table>
              <p style="margin:12px 0 0 0; font-size:13px; color:#888;">
                Please pay the fine at the library counter at your earliest convenience.
              </p>
            </td>
          </tr>
        </table>
      `
        : `
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:#e8f5e9; border:1px solid #c8e6c9; border-radius:8px; margin-bottom:20px;">
          <tr>
            <td style="padding:16px 20px; text-align:center;">
              <p style="margin:0; font-size:15px; font-weight:bold; color:#2e7d32;">
                🎉 No Fine — Returned on time! Thank you.
              </p>
            </td>
          </tr>
        </table>
      `;

    html = html
      .replace(/{{STUDENT_NAME}}/g, studentName)
      .replace(/{{BOOK_TITLE}}/g, bookTitle)
      .replace(/{{BOOK_AUTHOR}}/g, bookAuthor)
      .replace(/{{BOOK_CATEGORY}}/g, bookCategory)
      .replace(/{{ISSUE_DATE}}/g, issueDate)
      .replace(/{{DUE_DATE}}/g, dueDate)
      .replace(/{{RETURNED_AT}}/g, returnedAt)
      .replace(/{{FINE_SECTION}}/g, fineSection);

    const info = await transporter.sendMail({
      from: `"Library Management System" <${process.env.EMAIL_USER}>`,
      to,
      subject:
        fineAmount > 0
          ? `📚 Book Returned — Fine of ₹${fineAmount} applicable | ${bookTitle}`
          : `📚 Book Returned Successfully — No Fine | ${bookTitle}`,
      html,
    });

    logger.info(`BOOK RETURNED EMAIL SENT: ${info.messageId} → ${to}`);

    return info;
  } catch (error) {
    logger.error('BOOK RETURNED EMAIL ERROR', error);

    throw new Error('EMAIL_SEND_FAILED');
  }
};
