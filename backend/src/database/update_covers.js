// Quick script to update book cover images in the database
// Uses Open Library Covers API which allows hotlinking
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

const COVER_MAP = {
  '9789351760148': 'https://covers.openlibrary.org/b/isbn/9789351760148-L.jpg',   // Quantitative Aptitude
  '9789384761549': 'https://covers.openlibrary.org/b/isbn/9789384761549-L.jpg',   // General Knowledge
  '9788192931427': 'https://covers.openlibrary.org/b/isbn/9788192931427-L.jpg',   // SSC Reasoning
  '9781259004612': 'https://covers.openlibrary.org/b/isbn/9781259004612-L.jpg',   // C Programming
  '9789332901539': 'https://covers.openlibrary.org/b/isbn/9789332901539-L.jpg',   // Digital Electronics
  '9780070701986': 'https://covers.openlibrary.org/b/isbn/9780070701986-L.jpg',   // Data Structures
  '9781119456339': 'https://covers.openlibrary.org/b/isbn/9781119456339-L.jpg',   // Operating System
  '9780078022159': 'https://covers.openlibrary.org/b/isbn/9780078022159-L.jpg',   // Database System
  '9789332575778': 'https://covers.openlibrary.org/b/isbn/9789332575778-L.jpg',   // Computer Networks
  '9780061122415': 'https://covers.openlibrary.org/b/isbn/9780061122415-L.jpg',   // The Alchemist
  '9781612680194': 'https://covers.openlibrary.org/b/isbn/9781612680194-L.jpg',   // Rich Dad Poor Dad
  '9780735211292': 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg'    // Atomic Habits
};

async function updateCovers() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      port: process.env.DB_PORT || 3306,
      database: process.env.DB_NAME || 'library_db'
    });

    for (const [isbn, coverUrl] of Object.entries(COVER_MAP)) {
      await connection.query('UPDATE books SET book_image = ? WHERE isbn = ?', [coverUrl, isbn]);
    }

    console.log('✓ Book cover images updated for all 12 books');
  } catch (error) {
    console.error('Failed to update covers:', error.message);
  } finally {
    if (connection) await connection.end();
    process.exit(0);
  }
}

updateCovers();
