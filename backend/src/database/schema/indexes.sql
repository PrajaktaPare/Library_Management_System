-- =========================
-- USERS TABLE INDEXES
-- =========================

-- already created automatically
-- UNIQUE INDEX on email
-- UNIQUE INDEX on phone
-- PRIMARY KEY on id
-- F K 


-- active users filtering
CREATE INDEX idx_users_is_active
ON users(is_active);

-- soft delete filtering
CREATE INDEX idx_users_is_deleted
ON users(is_deleted);



-- =========================
-- BOOKS TABLE INDEXES
-- =========================

-- already created automatically
-- PRIMARY KEY on id
-- UNIQUE INDEX on book_num

-- search by title
CREATE INDEX idx_books_title
ON books(title);

-- search by author
CREATE INDEX idx_books_author
ON books(author);

-- filtering books
CREATE INDEX idx_books_category_status
ON books(category, status);



-- =========================
-- BOOK REQUESTS TABLE INDEXES
-- =========================

-- already created automatically
-- PRIMARY KEY on id
-- F K


-- student pending/issued requests
CREATE INDEX idx_book_requests_student_status
ON book_requests(student_id, request_status);

CREATE INDEX idx_status
ON book_requests( request_status);


-- =========================
-- BOOK ISSUED TABLE INDEXES
-- =========================

-- already created automatically
-- PRIMARY KEY on id
-- F K

-- active/due books of student
CREATE INDEX idx_book_issued_student_status
ON book_issued(student_id, status);

CREATE INDEX idx_status
ON book_issued(status);