-- CREATE DATABASE
CREATE DATABASE IF NOT EXISTS smart_library_management_system;

-- USE DATABASE
USE smart_library_management_system;

-- ROLES TABLE
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL
);

-- USERS TABLE
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  role_id INT DEFAULT 2,
  is_active BOOLEAN DEFAULT 0,
  is_verified BOOLEAN DEFAULT 0,
  is_deleted BOOLEAN DEFAULT 0,
  verification_token VARCHAR(255),
  reset_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (role_id)
    REFERENCES roles(id)
);

-- BOOKS TABLE
CREATE TABLE books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(100) NOT NULL,
  book_num VARCHAR(20) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL,
  sub_category VARCHAR(50),
  total_copies INT DEFAULT 0,
  available_copies INT DEFAULT 0,

  status ENUM(
    'available',
    'unavailable'
  ) DEFAULT 'unavailable',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- BOOK REQUESTS TABLE
CREATE TABLE book_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,

  student_id INT NOT NULL,
  book_id INT NOT NULL,

  request_status ENUM(
    'pending',
    'issued',
    'rejected'
  ) DEFAULT 'pending',

  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  issued_at TIMESTAMP NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (student_id)
    REFERENCES users(id),

  FOREIGN KEY (book_id)
    REFERENCES books(id)
);

-- ISSUES TABLE
CREATE TABLE issues (
  id INT AUTO_INCREMENT PRIMARY KEY,

  request_id INT NOT NULL,
  student_id INT NOT NULL,
  book_id INT NOT NULL,

  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE NULL,

  fine_amount DECIMAL(10,2)
    DEFAULT 0.00,

  status ENUM(
    'active',
    'due',
    'returned'
  ) DEFAULT 'active',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (request_id)
    REFERENCES book_requests(id),

  FOREIGN KEY (student_id)
    REFERENCES users(id),

  FOREIGN KEY (book_id)
    REFERENCES books(id)
);
