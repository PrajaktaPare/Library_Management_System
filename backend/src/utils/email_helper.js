// Email helper using Nodemailer for sending transactional emails
import nodemailer from 'nodemailer';
import logger from './logger.js';

class EmailHelper {
  static transporter = null;

  // Initialize the transporter (called once on startup)
  static initialize() {
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASS;

    // Skip if no real credentials configured
    if (!user || !pass || user === 'your_email@gmail.com' || pass === 'your_password') {
      logger.warn('Email not configured — set MAIL_USER and MAIL_PASS in .env to enable email notifications');
      this.transporter = null;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.MAIL_PORT) || 587,
        secure: false,
        auth: { user, pass }
      });
      logger.info('Email transporter initialized');
    } catch (error) {
      logger.warn('Email transporter failed to initialize: ' + error.message);
      this.transporter = null;
    }
  }

  // Generic send email method
  static async sendEmail(to, subject, html) {
    if (!this.transporter) {
      logger.warn('Email not sent — transporter not initialized');
      return false;
    }
    try {
      await this.transporter.sendMail({
        from: `"Smart Library" <${process.env.MAIL_USER}>`,
        to,
        subject,
        html
      });
      logger.info(`Email sent to ${to}: ${subject}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send email to ${to}: ${error.message}`);
      return false;
    }
  }

  // Welcome email for new user registration
  static async sendWelcomeEmail(email, name, username) {
    const subject = '🎉 Welcome to Smart Library!';
    const html = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="background:linear-gradient(135deg,#0d7377 0%,#14919b 100%);padding:40px 32px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:28px">📚 Smart Library</h1>
          <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:16px">Welcome aboard, ${name}!</p>
        </div>
        <div style="padding:32px">
          <p style="color:#334155;font-size:16px;line-height:1.6">Hi <strong>${name}</strong>,</p>
          <p style="color:#334155;font-size:16px;line-height:1.6">Your account has been created successfully. Here are your details:</p>
          <div style="background:#fff;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e2e8f0">
            <p style="margin:8px 0;color:#475569"><strong>Username:</strong> ${username}</p>
            <p style="margin:8px 0;color:#475569"><strong>Email:</strong> ${email}</p>
            <p style="margin:8px 0;color:#475569"><strong>Role:</strong> Student</p>
          </div>
          <p style="color:#334155;font-size:16px;line-height:1.6">You can now browse and request books from our library. Happy reading! 📖</p>
          <p style="color:#94a3b8;font-size:14px;margin-top:24px">— The Smart Library Team</p>
        </div>
      </div>`;
    return this.sendEmail(email, subject, html);
  }

  // Book issued notification email
  static async sendBookIssuedEmail(email, name, bookTitle, issueDate, dueDate) {
    const subject = `📖 Book Issued: "${bookTitle}"`;
    const html = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="background:linear-gradient(135deg,#0d7377 0%,#14919b 100%);padding:40px 32px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:28px">📚 Book Issued</h1>
        </div>
        <div style="padding:32px">
          <p style="color:#334155;font-size:16px;line-height:1.6">Hi <strong>${name}</strong>,</p>
          <p style="color:#334155;font-size:16px;line-height:1.6">The following book has been issued to you:</p>
          <div style="background:#fff;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e2e8f0">
            <p style="margin:8px 0;color:#475569"><strong>Book:</strong> ${bookTitle}</p>
            <p style="margin:8px 0;color:#475569"><strong>Issue Date:</strong> ${issueDate}</p>
            <p style="margin:8px 0;color:#475569"><strong>Due Date:</strong> ${dueDate}</p>
          </div>
          <div style="background:#fef3c7;border-radius:12px;padding:16px;margin:20px 0;border:1px solid #fcd34d">
            <p style="margin:0;color:#92400e;font-size:14px">⚠️ <strong>Important:</strong> Please return the book by the due date. Late returns will incur a fine of ₹5 per day.</p>
          </div>
          <p style="color:#94a3b8;font-size:14px;margin-top:24px">— The Smart Library Team</p>
        </div>
      </div>`;
    return this.sendEmail(email, subject, html);
  }

  // Due date reminder (2 days before)
  static async sendDueDateReminderEmail(email, name, bookTitle, dueDate) {
    const subject = `⏰ Reminder: "${bookTitle}" due in 2 days`;
    const html = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:40px 32px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:28px">⏰ Due Date Reminder</h1>
        </div>
        <div style="padding:32px">
          <p style="color:#334155;font-size:16px;line-height:1.6">Hi <strong>${name}</strong>,</p>
          <p style="color:#334155;font-size:16px;line-height:1.6">This is a friendly reminder that your book is due in <strong>2 days</strong>:</p>
          <div style="background:#fff;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e2e8f0">
            <p style="margin:8px 0;color:#475569"><strong>Book:</strong> ${bookTitle}</p>
            <p style="margin:8px 0;color:#475569"><strong>Due Date:</strong> ${dueDate}</p>
          </div>
          <div style="background:#fef3c7;border-radius:12px;padding:16px;margin:20px 0;border:1px solid #fcd34d">
            <p style="margin:0;color:#92400e;font-size:14px">⚠️ Late returns will incur a fine of ₹5 per day. Please return the book on time to avoid penalties.</p>
          </div>
          <p style="color:#94a3b8;font-size:14px;margin-top:24px">— The Smart Library Team</p>
        </div>
      </div>`;
    return this.sendEmail(email, subject, html);
  }

  // Password changed notification
  static async sendPasswordChangedEmail(email, name) {
    const subject = '🔒 Password Changed Successfully';
    const html = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="background:linear-gradient(135deg,#0d7377 0%,#14919b 100%);padding:40px 32px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:28px">🔒 Password Updated</h1>
        </div>
        <div style="padding:32px">
          <p style="color:#334155;font-size:16px;line-height:1.6">Hi <strong>${name}</strong>,</p>
          <p style="color:#334155;font-size:16px;line-height:1.6">Your password has been changed successfully. If you did not make this change, please contact the library administrator immediately.</p>
          <p style="color:#94a3b8;font-size:14px;margin-top:24px">— The Smart Library Team</p>
        </div>
      </div>`;
    return this.sendEmail(email, subject, html);
  }

  // Phone number updated notification
  static async sendPhoneUpdatedEmail(email, name, newPhone) {
    const subject = '📱 Phone Number Updated';
    const html = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="background:linear-gradient(135deg,#0d7377 0%,#14919b 100%);padding:40px 32px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:28px">📱 Phone Updated</h1>
        </div>
        <div style="padding:32px">
          <p style="color:#334155;font-size:16px;line-height:1.6">Hi <strong>${name}</strong>,</p>
          <p style="color:#334155;font-size:16px;line-height:1.6">Your phone number has been updated to <strong>${newPhone}</strong>.</p>
          <p style="color:#334155;font-size:16px;line-height:1.6">If you did not make this change, please contact the library administrator immediately.</p>
          <p style="color:#94a3b8;font-size:14px;margin-top:24px">— The Smart Library Team</p>
        </div>
      </div>`;
    return this.sendEmail(email, subject, html);
  }

  // Overdue fine notification
  static async sendOverdueFineEmail(email, name, bookTitle, dueDate, daysOverdue, fineAmount) {
    const subject = `🚨 Overdue: "${bookTitle}" — Fine ₹${fineAmount}`;
    const html = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="background:linear-gradient(135deg,#dc2626 0%,#b91c1c 100%);padding:40px 32px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:28px">🚨 Book Overdue</h1>
        </div>
        <div style="padding:32px">
          <p style="color:#334155;font-size:16px;line-height:1.6">Hi <strong>${name}</strong>,</p>
          <p style="color:#334155;font-size:16px;line-height:1.6">Your book is <strong>${daysOverdue} days overdue</strong>:</p>
          <div style="background:#fff;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e2e8f0">
            <p style="margin:8px 0;color:#475569"><strong>Book:</strong> ${bookTitle}</p>
            <p style="margin:8px 0;color:#475569"><strong>Due Date:</strong> ${dueDate}</p>
            <p style="margin:8px 0;color:#475569"><strong>Days Overdue:</strong> ${daysOverdue}</p>
            <p style="margin:8px 0;color:#dc2626;font-size:18px"><strong>Fine: ₹${fineAmount}</strong></p>
          </div>
          <p style="color:#334155;font-size:16px;line-height:1.6">Please return the book as soon as possible. The fine increases by ₹5 for each additional day.</p>
          <p style="color:#94a3b8;font-size:14px;margin-top:24px">— The Smart Library Team</p>
        </div>
      </div>`;
    return this.sendEmail(email, subject, html);
  }
}

export default EmailHelper;
