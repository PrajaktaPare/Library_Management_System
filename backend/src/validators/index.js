module.exports = {
  ...require('./auth_validator'),
  ...require('./book_validator'),
  ...require('./request_validator'),
  ...require('./issue_validator'),
  ...require('./user_validator')
};
