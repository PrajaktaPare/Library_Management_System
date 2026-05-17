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

export { register, login, verifyEmail } from './auth_controller.js';

export {
  getAllBooks,
  getBookById,
  getCategories,
  createBook,
  updateBook,
  deleteBook,
} from './book_controller.js';

export {
  requestBook,
  issueBook,
  rejectBookRequest,
  getAllRequests,
  getMyRequests,
  cancelRequest,
} from './book_request_controller.js';

export {
  returnBook,
  getAllIssues,
  getMyIssues,
  getIssueById,
} from './issue_controller.js';
