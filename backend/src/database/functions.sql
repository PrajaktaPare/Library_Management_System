-- Function: Calculate fine for overdue books
DELIMITER //
CREATE FUNCTION IF NOT EXISTS fn_calculate_fine(p_days_overdue INT, p_daily_rate DECIMAL(10, 2))
RETURNS DECIMAL(10, 2)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE fine DECIMAL(10, 2);
  SET fine = p_days_overdue * p_daily_rate;
  RETURN fine;
END//
DELIMITER ;

-- Function: Get active book requests count for a student
DELIMITER //
CREATE FUNCTION IF NOT EXISTS fn_active_requests_count(p_student_id INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE count INT;
  SELECT COUNT(*) INTO count FROM book_requests
  WHERE student_id = p_student_id
  AND request_status IN ('pending', 'approved', 'issued');
  RETURN count;
END//
DELIMITER ;

-- Function: Get overdue books for a student
DELIMITER //
CREATE FUNCTION IF NOT EXISTS fn_overdue_books_count(p_student_id INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE count INT;
  SELECT COUNT(*) INTO count FROM book_requests
  WHERE student_id = p_student_id
  AND request_status = 'issued'
  AND due_date < CURDATE();
  RETURN count;
END//
DELIMITER ;

-- Function: Get total fine amount for a student
DELIMITER //
CREATE FUNCTION IF NOT EXISTS fn_total_fine(p_student_id INT)
RETURNS DECIMAL(10, 2)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE total DECIMAL(10, 2);
  SELECT COALESCE(SUM(fine_amount), 0) INTO total
  FROM book_requests
  WHERE student_id = p_student_id;
  RETURN total;
END//
DELIMITER ;

-- Function: Check if book is available
DELIMITER //
CREATE FUNCTION IF NOT EXISTS fn_is_book_available(p_book_id INT)
RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE available INT;
  SELECT available_copies INTO available FROM books WHERE id = p_book_id;
  RETURN available > 0;
END//
DELIMITER ;
