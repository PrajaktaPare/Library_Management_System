// wraps multer upload handlers in promise so errors flow to express error middleware
import { uploadProfileImage, uploadBookImage } from '../config/multer_config.js';

// converts multer callback-based upload to a promise
function wrapMulter(multerFn) {
  return (req, res) =>
    new Promise((resolve, reject) => {
      multerFn(req, res, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
}

// middleware: handle avatar upload and pass errors to next()
export const handleProfileUpload = async (req, res, next) => {
  try {
    await wrapMulter(uploadProfileImage)(req, res);
    next();
  } catch (err) {
    next(err);
  }
};

// middleware: handle book-image upload and pass errors to next()
export const handleBookImageUpload = async (req, res, next) => {
  try {
    await wrapMulter(uploadBookImage)(req, res);
    next();
  } catch (err) {
    next(err);
  }
};