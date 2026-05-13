module.exports = {
  ADMIN: 'admin',
  STUDENT: 'student',
  
  ROLE_NAMES: {
    admin: 'Administrator',
    student: 'Student'
  },

  ROLE_PERMISSIONS: {
    admin: ['manage_books', 'manage_users', 'view_requests', 'issue_books', 'view_reports'],
    student: ['request_books', 'view_books', 'view_my_books', 'view_notifications']
  }
};
