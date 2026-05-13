-- Trigger: Auto-update available_copies when book is issued
CREATE TRIGGER IF NOT EXISTS tr_book_issued
AFTER UPDATE ON book_requests
FOR EACH ROW
BEGIN
  IF NEW.request_status = 'issued' AND OLD.request_status != 'issued' THEN
    UPDATE books SET available_copies = available_copies - 1 WHERE id = NEW.book_id;
  END IF;
END;

-- Trigger: Auto-update available_copies when book is returned
CREATE TRIGGER IF NOT EXISTS tr_book_returned
AFTER UPDATE ON book_requests
FOR EACH ROW
BEGIN
  IF NEW.request_status = 'returned' AND OLD.request_status != 'returned' THEN
    UPDATE books SET available_copies = available_copies + 1 WHERE id = NEW.book_id;
  END IF;
END;

-- Trigger: Create notification when book request is approved
CREATE TRIGGER IF NOT EXISTS tr_request_approved
AFTER UPDATE ON book_requests
FOR EACH ROW
BEGIN
  IF NEW.request_status = 'approved' AND OLD.request_status = 'pending' THEN
    INSERT INTO notifications (user_id, type, title, message, related_table, related_id)
    VALUES (
      NEW.student_id,
      'book_approved',
      'Book Request Approved',
      'Your book request has been approved. Please collect it from the library.',
      'book_requests',
      NEW.id
    );
  END IF;
END;

-- Trigger: Create notification when book request is rejected
CREATE TRIGGER IF NOT EXISTS tr_request_rejected
AFTER UPDATE ON book_requests
FOR EACH ROW
BEGIN
  IF NEW.request_status = 'rejected' AND OLD.request_status = 'pending' THEN
    INSERT INTO notifications (user_id, type, title, message, related_table, related_id)
    VALUES (
      NEW.student_id,
      'book_rejected',
      'Book Request Rejected',
      'Unfortunately, your book request has been rejected.',
      'book_requests',
      NEW.id
    );
  END IF;
END;

-- Trigger: Auto-create audit log on user insert
CREATE TRIGGER IF NOT EXISTS tr_audit_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
  INSERT INTO audit_logs (action, table_name, record_id, new_values)
  VALUES ('INSERT', 'users', NEW.id, JSON_OBJECT(
    'id', NEW.id,
    'username', NEW.username,
    'role', NEW.role
  ));
END;

-- Trigger: Auto-create audit log on book insert
CREATE TRIGGER IF NOT EXISTS tr_audit_book_insert
AFTER INSERT ON books
FOR EACH ROW
BEGIN
  INSERT INTO audit_logs (action, table_name, record_id, new_values)
  VALUES ('INSERT', 'books', NEW.id, JSON_OBJECT(
    'id', NEW.id,
    'title', NEW.title,
    'total_copies', NEW.total_copies
  ));
END;

-- Trigger: Auto-create audit log on book_requests update
CREATE TRIGGER IF NOT EXISTS tr_audit_request_update
AFTER UPDATE ON book_requests
FOR EACH ROW
BEGIN
  INSERT INTO audit_logs (action, table_name, record_id, old_values, new_values)
  VALUES ('UPDATE', 'book_requests', NEW.id,
    JSON_OBJECT('status', OLD.request_status),
    JSON_OBJECT('status', NEW.request_status)
  );
END;
