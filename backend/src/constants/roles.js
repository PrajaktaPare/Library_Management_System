export const ADMIN = 'admin';
export const STUDENT = 'student';

export const ROLE_NAMES = {
  admin: 'Administrator',
  student: 'Student'
};

export const ROLE_PERMISSIONS = {
  admin: ['manage_books', 'manage_users', 'view_requests', 'issue_books', 'view_reports'],
  student: ['request_books', 'view_books', 'view_my_books', 'view_notifications']
};
