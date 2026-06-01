-- INSERT DEFAULT ROLES
INSERT INTO roles (id, role_name)
VALUES
(1, 'admin'),
(2, 'student');

-- INSERT DEFAULT ADMIN
INSERT INTO users (
  email,
  password_hash,
  first_name,
  last_name,
  phone,
  role_id,
  is_active,
  is_verified
)
VALUES (
  'admin@gmail.com',
  '$2b$10$Xsr3xE7KQL0615ADBTs2SuH9.1L86r1gc11tMiZ8gzsep9DObynA6',
  'Admin',
  'User',
  '9999999999',
  1,
  1,
  1
);