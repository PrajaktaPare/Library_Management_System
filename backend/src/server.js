// Load environment variables from .env file before anything else
require('dotenv').config();
// Import the Express app instance
const app = require('./app');
// Import database init and teardown functions
const { initializeDatabase, closeDatabase, query } = require('./database/connection');
// Import logger for structured console/file logging
const logger = require('./utils/logger');
// Import email helper for initialization
const EmailHelper = require('./utils/email_helper');
// Import cron service for scheduled tasks
const CronService = require('./services/cron_service');
// Import filesystem and path modules for reading SQL files
const fs = require('fs');
const path = require('path');

// Read port from environment or default to 5000
const PORT = process.env.PORT || 5000;

// Main function to initialize database and start Express server
async function startServer() {
  try {
    // Initialize the database connection pool
    await initializeDatabase();

    // Auto-create tables by executing schema.sql if tables don't exist
    try {
      const schemaPath = path.join(__dirname, 'database', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        // Split by semicolons and execute each statement individually
        const statements = schemaSql.split(';').filter(s => s.trim());
        for (const stmt of statements) {
          if (stmt.trim()) {
            await query(stmt);
          }
        }
        logger.info('Database schema verified/created');
      }
    } catch (schemaError) {
      // Log but don't crash — tables may already exist
      logger.warn('Schema initialization note: ' + schemaError.message);
    }

    // Initialize email transporter
    EmailHelper.initialize();

    // Start cron jobs for reminders and fines
    CronService.start();

    // Start listening on the configured port
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      logger.info(`API Base URL: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    // Log error and exit if server fails to start
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Launch the server
startServer();
