// creates and exports a promise-based MySQL2 connection pool
import mysql from 'mysql2/promise';
import env from './env_config.js';

// pool keeps connections alive and limits max concurrency
const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true, // queue requests instead of failing when pool is full
  connectionLimit: 10, // max 10 simultaneous connections
  queueLimit: 0, // unlimited queue
  timezone: '+00:00', // store/retrieve all datetimes as UTC
  charset: 'utf8mb4',
});

// test the pool on startup to catch misconfigured credentials immediately
export async function testConnection() {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
}

export default pool;