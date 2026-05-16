// controllers/index.js

export {
  getAllUsers,
  getUserByID,
  postUser,
  patchUser,
  putUser,
  deleteUser,
  getProfile,
  updateProfile,
} from './user_controller.js';

export {
  register,
  login,
  verifyEmail,
} from './auth_controller.js';