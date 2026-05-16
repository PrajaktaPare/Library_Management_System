// Seed script: creates all tables and inserts default admin + sample books
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function seed() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      port: process.env.DB_PORT || 3306,
      multipleStatements: true
    });

    const dbName = process.env.DB_NAME || 'library_db';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✓ Database "${dbName}" ensured`);
    await connection.query(`USE \`${dbName}\``);

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schemaSql);
    console.log('✓ All tables created');

    const [admins] = await connection.query('SELECT id FROM users WHERE username = ?', ['admin']);
    if (admins.length === 0) {
      const adminHash = await bcrypt.hash('Admin@123', 12);
      await connection.query('INSERT INTO users (username, email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?, ?)', ['admin', 'admin@library.com', adminHash, 'Library Admin', '9999999999', 'admin']);
      console.log('✓ Default admin created (username: admin, password: Admin@123)');
    } else {
      console.log('→ Admin user already exists, skipping');
    }

    const [students] = await connection.query('SELECT id FROM users WHERE username = ?', ['student1']);
    if (students.length === 0) {
      const studentHash = await bcrypt.hash('Student@123', 12);
      await connection.query('INSERT INTO users (username, email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?, ?)', ['student1', 'student1@library.com', studentHash, 'Test Student', '8888888888', 'student']);
      console.log('✓ Default student created (username: student1, password: Student@123)');
    } else {
      console.log('→ Student user already exists, skipping');
    }

    const [bookCount] = await connection.query('SELECT COUNT(*) as count FROM books');
    if (bookCount[0].count === 0) {
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
      for (const book of books) {
        await connection.query('INSERT INTO books (title, author, isbn, category, sub_category, total_copies, available_copies) VALUES (?, ?, ?, ?, ?, ?, ?)', book);
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
    console.error('Seed failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
    process.exit(0);
  }
}

seed();
