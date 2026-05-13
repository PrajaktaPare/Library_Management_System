// Cron job service for scheduled tasks like due date reminders and fine calculation
const cron = require('node-cron');
const { query } = require('../database/connection');
const EmailHelper = require('../utils/email_helper');
const logger = require('../utils/logger');

class CronService {
  // Start all cron jobs
  static start() {
    // Run every day at 9:00 AM — send due date reminders (2 days before)
    cron.schedule('0 9 * * *', async () => {
      logger.info('Running due date reminder cron job...');
      await this.sendDueDateReminders();
    });

    // Run every day at 10:00 AM — calculate fines for overdue books
    cron.schedule('0 10 * * *', async () => {
      logger.info('Running overdue fine calculation cron job...');
      await this.calculateOverdueFines();
    });

    logger.info('Cron jobs initialized');
  }

  // Send reminders for books due in 2 days
  static async sendDueDateReminders() {
    try {
      const sql = `
        SELECT br.id, br.due_date, b.title, u.name, u.email
        FROM book_requests br
        JOIN books b ON br.book_id = b.id
        JOIN users u ON br.student_id = u.id
        WHERE br.request_status = 'issued'
        AND br.due_date = DATE_ADD(CURDATE(), INTERVAL 2 DAY)
      `;
      const results = await query(sql);

      for (const row of results) {
        if (row.email) {
          const dueDate = new Date(row.due_date).toLocaleDateString('en-IN');
          await EmailHelper.sendDueDateReminderEmail(row.email, row.name, row.title, dueDate);
        }
      }

      logger.info(`Sent ${results.length} due date reminders`);
    } catch (error) {
      logger.error('Due date reminder cron failed: ' + error.message);
    }
  }

  // Calculate and update fines for overdue books (₹5/day)
  static async calculateOverdueFines() {
    try {
      const sql = `
        SELECT br.id, br.due_date, br.fine_amount, b.title, u.name, u.email
        FROM book_requests br
        JOIN books b ON br.book_id = b.id
        JOIN users u ON br.student_id = u.id
        WHERE br.request_status = 'issued'
        AND br.due_date < CURDATE()
      `;
      const overdueBooks = await query(sql);

      for (const book of overdueBooks) {
        const dueDate = new Date(book.due_date);
        const today = new Date();
        const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
        const fineAmount = daysOverdue * 5; // ₹5 per day

        // Update fine in database
        await query('UPDATE book_requests SET fine_amount = ? WHERE id = ?', [fineAmount, book.id]);

        // Send overdue email (only once a week to avoid spam — check if fine changed)
        if (fineAmount !== book.fine_amount && book.email && daysOverdue % 3 === 0) {
          const dueDateStr = dueDate.toLocaleDateString('en-IN');
          await EmailHelper.sendOverdueFineEmail(book.email, book.name, book.title, dueDateStr, daysOverdue, fineAmount);
        }
      }

      logger.info(`Updated fines for ${overdueBooks.length} overdue books`);
    } catch (error) {
      logger.error('Fine calculation cron failed: ' + error.message);
    }
  }
}

module.exports = CronService;
