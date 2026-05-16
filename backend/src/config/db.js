import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST, // Database host
  user: process.env.DB_USER, // Database username
  password: process.env.DB_PASSWORD, // Database password
  database: process.env.DB_NAME, // Database name
  waitForConnections: true, // Wait if all connections are busy
  connectionLimit: 10, // Maximum connections in pool
});

// Test database connection
const connectDB = async () => {
  try {
    const conn = await pool.getConnection(); // Get connection from pool
    console.log('DB Connected');
    conn.release(); // Release connection back to pool
  } catch (err) {
    console.error('DB Connection Failed:', err.message);
    process.exit(1); // Stop server if DB connection fails
  }
};

// Export connectDB function
export { connectDB };

// Export pool for queries
export default pool;
