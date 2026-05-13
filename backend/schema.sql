-- ─────────────────────────────────────────────────────────────────────────────
-- Smart Library Management System — MySQL Schema
-- Run this file once to bootstrap the database
-- ─────────────────────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS smart_library CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_library;

-- ─── Drop tables in reverse dependency order ──────────────────────────────────
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS fines;
DROP TABLE IF EXISTS issues;
DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS users;

-- ─── users ────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  username    VARCHAR(50)  NOT NULL,
  name        VARCHAR(100) NOT NULL,
  password    VARCHAR(255) NOT NULL,               -- bcrypt hash
  role        ENUM('admin','student') NOT NULL DEFAULT 'student',
  phone       VARCHAR(15)  NULL,
  avatar      VARCHAR(255) NULL,                   -- relative path to uploaded image
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_username (username),
  UNIQUE KEY uq_phone    (phone)
) ENGINE=InnoDB;

-- ─── books ────────────────────────────────────────────────────────────────────
CREATE TABLE books (
  id               CHAR(36)     NOT NULL DEFAULT (UUID()),
  title            VARCHAR(255) NOT NULL,
  author           VARCHAR(255) NOT NULL,
  isbn             VARCHAR(20)  NOT NULL,
  category         VARCHAR(100) NOT NULL,
  sub_category     VARCHAR(100) NULL,
  image            VARCHAR(255) NULL,              -- relative path or URL
  total_copies     INT UNSIGNED NOT NULL DEFAULT 1,
  available_copies INT UNSIGNED NOT NULL DEFAULT 1,
  is_active        TINYINT(1)   NOT NULL DEFAULT 1,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_isbn (isbn),
  INDEX idx_category (category),
  INDEX idx_title    (title),
  -- ensure available_copies never exceeds total_copies
  CONSTRAINT chk_copies CHECK (available_copies <= total_copies)
) ENGINE=InnoDB;

-- ─── requests ─────────────────────────────────────────────────────────────────
CREATE TABLE requests (
  id           CHAR(36)   NOT NULL DEFAULT (UUID()),
  user_id      CHAR(36)   NOT NULL,
  book_id      CHAR(36)   NOT NULL,
  status       ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at   DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY fk_req_user (user_id) REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY fk_req_book (book_id) REFERENCES books(id)  ON DELETE CASCADE,
  -- one pending request per student per book
  UNIQUE KEY uq_pending_request (user_id, book_id, status)
) ENGINE=InnoDB;

-- ─── issues ───────────────────────────────────────────────────────────────────
CREATE TABLE issues (
  id          CHAR(36)   NOT NULL DEFAULT (UUID()),
  user_id     CHAR(36)   NOT NULL,
  book_id     CHAR(36)   NOT NULL,
  request_id  CHAR(36)   NULL,                    -- link back to the originating request
  issue_date  DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_date    DATETIME   NOT NULL,
  return_date DATETIME   NULL,
  status      ENUM('active','returned','overdue') NOT NULL DEFAULT 'active',
  fine_amount DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  fine_paid   TINYINT(1) NOT NULL DEFAULT 0,
  created_at  DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY fk_issue_user    (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY fk_issue_book    (book_id)    REFERENCES books(id)    ON DELETE RESTRICT,
  FOREIGN KEY fk_issue_request (request_id) REFERENCES requests(id) ON DELETE SET NULL,
  INDEX idx_issue_user   (user_id),
  INDEX idx_issue_status (status)
) ENGINE=InnoDB;

-- ─── fines ────────────────────────────────────────────────────────────────────
CREATE TABLE fines (
  id         CHAR(36)      NOT NULL DEFAULT (UUID()),
  issue_id   CHAR(36)      NOT NULL,
  user_id    CHAR(36)      NOT NULL,
  amount     DECIMAL(8,2)  NOT NULL,
  paid       TINYINT(1)    NOT NULL DEFAULT 0,
  paid_at    DATETIME      NULL,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY fk_fine_issue (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  FOREIGN KEY fk_fine_user  (user_id)  REFERENCES users(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── notifications ────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id         CHAR(36)     NOT NULL DEFAULT (UUID()),
  user_id    CHAR(36)     NOT NULL,
  message    TEXT         NOT NULL,
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY fk_notif_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notif_user (user_id)
) ENGINE=InnoDB;

-- ─── refresh_tokens ───────────────────────────────────────────────────────────
CREATE TABLE refresh_tokens (
  id         CHAR(36)     NOT NULL DEFAULT (UUID()),
  user_id    CHAR(36)     NOT NULL,
  token      TEXT         NOT NULL,               -- hashed token stored, raw sent in cookie
  expires_at DATETIME     NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY fk_rt_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_rt_user (user_id)
) ENGINE=InnoDB;


-- ─────────────────────────────────────────────────────────────────────────────
-- STORED PROCEDURES / FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────────────

DELIMITER $$

-- fn_calculate_fine: returns fine amount for an issue based on overdue days
CREATE FUNCTION fn_calculate_fine(p_due_date DATETIME, p_fine_per_day DECIMAL(8,2))
  RETURNS DECIMAL(8,2)
  DETERMINISTIC
  READS SQL DATA
BEGIN
  DECLARE v_days INT DEFAULT 0;
  -- only count overdue days (negative means not overdue → 0)
  SET v_days = GREATEST(0, DATEDIFF(NOW(), p_due_date));
  RETURN v_days * p_fine_per_day;
END$$

-- sp_approve_request: approve a request, create an issue, decrement available copies
CREATE PROCEDURE sp_approve_request(
  IN  p_request_id    CHAR(36),
  IN  p_loan_days     INT,
  IN  p_fine_per_day  DECIMAL(8,2),
  OUT p_issue_id      CHAR(36),
  OUT p_error         VARCHAR(255)
)
BEGIN
  DECLARE v_user_id   CHAR(36);
  DECLARE v_book_id   CHAR(36);
  DECLARE v_avail     INT;
  DECLARE v_issue_id  CHAR(36);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET p_error = 'Database error during approval';
    SET p_issue_id = NULL;
  END;

  START TRANSACTION;

  -- fetch request details
  SELECT user_id, book_id INTO v_user_id, v_book_id
  FROM requests WHERE id = p_request_id AND status = 'pending'
  FOR UPDATE;

  IF v_user_id IS NULL THEN
    SET p_error = 'Request not found or already processed';
    SET p_issue_id = NULL;
    ROLLBACK;
  ELSE
    -- check availability with row-level lock
    SELECT available_copies INTO v_avail
    FROM books WHERE id = v_book_id FOR UPDATE;

    IF v_avail <= 0 THEN
      SET p_error = 'No copies available';
      SET p_issue_id = NULL;
      ROLLBACK;
    ELSE
      -- generate new UUID for issue
      SET v_issue_id = UUID();

      -- create issue record
      INSERT INTO issues (id, user_id, book_id, request_id, due_date)
      VALUES (
        v_issue_id,
        v_user_id,
        v_book_id,
        p_request_id,
        DATE_ADD(NOW(), INTERVAL p_loan_days DAY)
      );

      -- decrement available copies
      UPDATE books SET available_copies = available_copies - 1 WHERE id = v_book_id;

      -- update request status
      UPDATE requests SET status = 'approved' WHERE id = p_request_id;

      SET p_issue_id = v_issue_id;
      SET p_error    = NULL;
      COMMIT;
    END IF;
  END IF;
END$$

-- sp_return_book: mark a book as returned, restore copies, record fine
CREATE PROCEDURE sp_return_book(
  IN  p_issue_id     CHAR(36),
  IN  p_fine_per_day DECIMAL(8,2),
  OUT p_fine_amount  DECIMAL(8,2),
  OUT p_error        VARCHAR(255)
)
BEGIN
  DECLARE v_book_id   CHAR(36);
  DECLARE v_user_id   CHAR(36);
  DECLARE v_status    VARCHAR(20);
  DECLARE v_due_date  DATETIME;
  DECLARE v_fine      DECIMAL(8,2) DEFAULT 0;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET p_error = 'Database error during return';
    SET p_fine_amount = 0;
  END;

  START TRANSACTION;

  -- lock the issue row
  SELECT book_id, user_id, status, due_date
  INTO v_book_id, v_user_id, v_status, v_due_date
  FROM issues WHERE id = p_issue_id FOR UPDATE;

  IF v_book_id IS NULL THEN
    SET p_error = 'Issue record not found';
    SET p_fine_amount = 0;
    ROLLBACK;
  ELSEIF v_status = 'returned' THEN
    SET p_error = 'Book already returned';
    SET p_fine_amount = 0;
    ROLLBACK;
  ELSE
    -- calculate fine
    SET v_fine = fn_calculate_fine(v_due_date, p_fine_per_day);

    -- mark returned
    UPDATE issues
    SET status = 'returned', return_date = NOW(), fine_amount = v_fine
    WHERE id = p_issue_id;

    -- restore copy
    UPDATE books SET available_copies = available_copies + 1 WHERE id = v_book_id;

    -- create fine record if there is a fine
    IF v_fine > 0 THEN
      INSERT INTO fines (id, issue_id, user_id, amount)
      VALUES (UUID(), p_issue_id, v_user_id, v_fine);
    END IF;

    SET p_fine_amount = v_fine;
    SET p_error       = NULL;
    COMMIT;
  END IF;
END$$

-- sp_reject_request: reject a pending request
CREATE PROCEDURE sp_reject_request(
  IN  p_request_id CHAR(36),
  OUT p_user_id    CHAR(36),
  OUT p_book_title VARCHAR(255),
  OUT p_error      VARCHAR(255)
)
BEGIN
  DECLARE v_user_id    CHAR(36);
  DECLARE v_book_title VARCHAR(255);

  SELECT r.user_id, b.title
  INTO v_user_id, v_book_title
  FROM requests r
  JOIN books b ON b.id = r.book_id
  WHERE r.id = p_request_id AND r.status = 'pending';

  IF v_user_id IS NULL THEN
    SET p_error    = 'Request not found or already processed';
    SET p_user_id  = NULL;
    SET p_book_title = NULL;
  ELSE
    UPDATE requests SET status = 'rejected' WHERE id = p_request_id;
    SET p_user_id    = v_user_id;
    SET p_book_title = v_book_title;
    SET p_error      = NULL;
  END IF;
END$$

DELIMITER ;


-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────

DELIMITER $$

-- trg_after_issue_update: auto-set status to 'overdue' when due_date passes
CREATE TRIGGER trg_issue_status_check
  BEFORE UPDATE ON issues
  FOR EACH ROW
BEGIN
  -- if still active and past due date, flag as overdue
  IF NEW.status = 'active' AND NEW.due_date < NOW() THEN
    SET NEW.status = 'overdue';
  END IF;
END$$

-- trg_books_available_guard: prevent available_copies from going negative
CREATE TRIGGER trg_books_avail_insert
  BEFORE INSERT ON books
  FOR EACH ROW
BEGIN
  IF NEW.available_copies > NEW.total_copies THEN
    SET NEW.available_copies = NEW.total_copies;
  END IF;
END$$

CREATE TRIGGER trg_books_avail_update
  BEFORE UPDATE ON books
  FOR EACH ROW
BEGIN
  IF NEW.available_copies > NEW.total_copies THEN
    SET NEW.available_copies = NEW.total_copies;
  END IF;
  -- prevent negative
  IF NEW.available_copies < 0 THEN
    SET NEW.available_copies = 0;
  END IF;
END$$

DELIMITER ;


-- ─────────────────────────────────────────────────────────────────────────────
-- SEED DATA
-- ─────────────────────────────────────────────────────────────────────────────

-- default admin (password: admiN@123 — bcrypt hash generated at runtime; this is placeholder)
-- NOTE: run `node src/utils/seed.js` to insert properly hashed users
-- The following inserts use a pre-computed bcrypt hash for admiN@123
INSERT INTO users (id, username, name, password, role, phone) VALUES
  (UUID(), 'admin',  'Administrator', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhem', 'admin',   '9000000001'),
  (UUID(), '246200', 'Demo Student',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', '9000000002');
-- admin password hash = admiN@123, student hash = studenT@00

-- seed books
INSERT INTO books (id, title, author, isbn, category, sub_category, total_copies, available_copies) VALUES
  (UUID(), 'Quantitative Aptitude',  'R.S. Aggarwal',     '9789351760148', 'Competitive Exam', 'Aptitude',   10, 10),
  (UUID(), 'General Knowledge 2025', 'Lucent',             '9789384761549', 'Competitive Exam', 'GK',          8,  8),
  (UUID(), 'SSC Reasoning',          'Kiran Publications', '9788192931427', 'Competitive Exam', 'Reasoning',   6,  6),
  (UUID(), 'C Programming',          'E. Balagurusamy',   '9781259004612', 'Academic',         'FY BCS',     12, 12),
  (UUID(), 'Digital Electronics',    'Morris Mano',        '9789332901539', 'Academic',         'FY BCS',      7,  7),
  (UUID(), 'Data Structures',        'Seymour Lipschutz',  '9780070701986', 'Academic',         'SY BCS',     10, 10),
  (UUID(), 'Operating System',       'Galvin',             '9781119456339', 'Academic',         'SY BCS',      9,  9),
  (UUID(), 'Database System',        'Korth',              '9780078022159', 'Academic',         'TY BCS',     11, 11),
  (UUID(), 'Computer Networks',      'Andrew Tanenbaum',   '9789332575778', 'Academic',         'TY BCS',      6,  6),
  (UUID(), 'The Alchemist',          'Paulo Coelho',       '9780061122415', 'Reading',          'Novel',       5,  5),
  (UUID(), 'Rich Dad Poor Dad',      'Robert Kiyosaki',   '9781612680194', 'Reading',          'Biography',   7,  7),
  (UUID(), 'Atomic Habits',          'James Clear',        '9780735211292', 'Reading',          'Biography',   6,  6);