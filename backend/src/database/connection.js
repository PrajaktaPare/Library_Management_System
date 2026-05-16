import mysql from 'mysql2/promise';
import logger from '../utils/logger.js';

let pool = null;

const initializeDatabase = async () => {
  try {
    const dbName = process.env.DB_NAME || 'library_db';
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      port: process.env.DB_PORT || 3306,
    });
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await tempConnection.end();

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

    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    logger.info('Database connected successfully');
    return pool;
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

const getConnection = async () => {
  if (!pool) await initializeDatabase();
  return pool.getConnection();
};

const query = async (sql, values = []) => {
  if (!pool) await initializeDatabase();
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.query(sql, values);
    return results;
  } finally {
    connection.release();
  }
};

const closeDatabase = async () => {
  if (pool) {
    await pool.end();
    logger.info('Database connection closed');
  }
};

export { initializeDatabase, getConnection, query, closeDatabase };
export const getPool = () => pool;
