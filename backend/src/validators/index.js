// validators/index.js

export {
  registerValidator,
  loginValidator,
  validateRegister,
  validateLogin,
} from './auth_validator.js';

export {
  userIdValidator,
  createUserValidator,
  updateProfileValidator,
  patchUserValidator,
  putUserValidator,
} from './user_validator.js';