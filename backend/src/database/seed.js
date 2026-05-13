// Seed script: creates all tables and inserts default admin + sample books
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Main seed function
async function seed() {
  let connection;
  try {
    // Connect without specifying a database first
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      port: process.env.DB_PORT || 3306,
      multipleStatements: true
    });

    const dbName = process.env.DB_NAME || 'library_db';

    // Create the database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✓ Database "${dbName}" ensured`);

    // Switch to the target database
    await connection.query(`USE \`${dbName}\``);

    // Read and execute the schema SQL file to create all tables
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schemaSql);
    console.log('✓ All tables created');

    // Check if admin user already exists
    const [admins] = await connection.query('SELECT id FROM users WHERE username = ?', ['admin']);
    if (admins.length === 0) {
      // Hash the default admin password
      const adminHash = await bcrypt.hash('Admin@123', 12);
      // Insert the default admin user
      await connection.query(
        'INSERT INTO users (username, email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
        ['admin', 'admin@library.com', adminHash, 'Library Admin', '9999999999', 'admin']
      );
      console.log('✓ Default admin created (username: admin, password: Admin@123)');
    } else {
      console.log('→ Admin user already exists, skipping');
    }

    // Check if a test student already exists
    const [students] = await connection.query('SELECT id FROM users WHERE username = ?', ['student1']);
    if (students.length === 0) {
      // Hash the default student password
      const studentHash = await bcrypt.hash('Student@123', 12);
      // Insert a test student user
      await connection.query(
        'INSERT INTO users (username, email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
        ['student1', 'student1@library.com', studentHash, 'Test Student', '8888888888', 'student']
      );
      console.log('✓ Default student created (username: student1, password: Student@123)');
    } else {
      console.log('→ Student user already exists, skipping');
    }

    // Check if books have been seeded already
    const [bookCount] = await connection.query('SELECT COUNT(*) as count FROM books');
    if (bookCount[0].count === 0) {
      // Insert sample books into the database
      const books = [
        ['Quantitative Aptitude', 'R.S. Aggarwal', '9789351760148', 'Competitive Exam', 'Aptitude', 10, 10],
        ['General Knowledge 2025', 'Lucent', '9789384761549', 'Competitive Exam', 'GK', 8, 8],
        ['SSC Reasoning', 'Kiran Publications', '9788192931427', 'Competitive Exam', 'Reasoning', 6, 6],
        ['C Programming', 'E. Balagurusamy', '9781259004612', 'Academic', 'FY BCS', 12, 12],
        ['Digital Electronics', 'Morris Mano', '9789332901539', 'Academic', 'FY BCS', 7, 7],
        ['Data Structures', 'Seymour Lipschutz', '9780070701986', 'Academic', 'SY BCS', 10, 10],
        ['Operating System', 'Galvin', '9781119456339', 'Academic', 'SY BCS', 9, 9],
        ['Database System', 'Korth', '9780078022159', 'Academic', 'TY BCS', 11, 11],
        ['Computer Networks', 'Andrew Tanenbaum', '9789332575778', 'Academic', 'TY BCS', 6, 6],
        ['The Alchemist', 'Paulo Coelho', '9780061122415', 'Reading', 'Novel', 5, 5],
        ['Rich Dad Poor Dad', 'Robert Kiyosaki', '9781612680194', 'Reading', 'Biography', 7, 7],
        ['Atomic Habits', 'James Clear', '9780735211292', 'Reading', 'Biography', 6, 6]
      ];

      // Insert each book row into the books table
      for (const book of books) {
        await connection.query(
          'INSERT INTO books (title, author, isbn, category, sub_category, total_copies, available_copies) VALUES (?, ?, ?, ?, ?, ?, ?)',
          book
        );
      }
      console.log(`✓ ${books.length} sample books seeded`);
    } else {
      console.log(`→ Books already exist (${bookCount[0].count}), skipping`);
    }

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('Default Credentials:');
    console.log('  Admin   → username: admin      password: Admin@123');
    console.log('  Student → username: student1   password: Student@123');

  } catch (error) {
    // Log any errors that occurred during seeding
    console.error('Seed failed:', error.message);
    process.exit(1);
  } finally {
    // Close the database connection when done
    if (connection) await connection.end();
    process.exit(0);
  }
}

// Execute the seed function
seed();
