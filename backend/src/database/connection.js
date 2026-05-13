// Import mysql2 promise-based driver for async/await support
const mysql = require('mysql2/promise');
// Import custom logger for structured logging
const logger = require('../utils/logger');

// Hold a reference to the database connection pool
let pool = null;

// Initialize database connection pool with config from .env
const initializeDatabase = async () => {
  try {
    const dbName = process.env.DB_NAME || 'library_db';

    // First, create a temporary connection to ensure the database exists
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      port: process.env.DB_PORT || 3306,
    });
    // Create the database if it does not exist
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await tempConnection.end();

    // Create the pool with database specified so all connections use it
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      port: process.env.DB_PORT || 3306,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      multipleStatements: true
    });

    // Test connection by pinging the database
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    logger.info('Database connected successfully');
    return pool;
  } catch (error) {
    // Log error and exit if database connection fails
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Get a connection from the pool, initializing if needed
const getConnection = async () => {
  if (!pool) {
    await initializeDatabase();
  }
  return pool.getConnection();
};

// Execute a SQL query using a pooled connection
const query = async (sql, values = []) => {
  if (!pool) {
    await initializeDatabase();
  }
  const connection = await pool.getConnection();
  try {
    // Use query() instead of execute() for better parameter type handling
    const [results] = await connection.query(sql, values);
    return results;
  } finally {
    // Always release the connection back to the pool
    connection.release();
  }
};

// Close all connections in the pool gracefully
const closeDatabase = async () => {
  if (pool) {
    await pool.end();
    logger.info('Database connection closed');
  }
};

// Export all database utilities for use across the application
module.exports = {
  initializeDatabase,
  getConnection,
  query,
  closeDatabase,
  pool: () => pool
};
