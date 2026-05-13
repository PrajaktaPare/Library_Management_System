// multer configuration for profile-image and book-image uploads
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import env from './env_config.js';

// helper: build a disk-storage engine with the given destination folder
function buildDiskStorage(subfolder) {
  return multer.diskStorage({
    destination(_req, _file, cb) {
      cb(null, path.join(env.UPLOAD_DIR, subfolder));
    },
    filename(_req, file, cb) {
      // use uuid to prevent filename collisions
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    },
  });
}

// only accept jpeg / png / webp images
function imageFilter(_req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG and WEBP images are allowed'), false);
  }
}

const maxSize = env.MAX_FILE_SIZE_MB * 1024 * 1024; // convert MB → bytes

// profile image uploader — single file, field name "avatar"
export const uploadProfileImage = multer({
  storage: buildDiskStorage('profile_images'),
  fileFilter: imageFilter,
  limits: { fileSize: maxSize },
}).single('avatar');

// book cover uploader — single file, field name "image"
export const uploadBookImage = multer({
  storage: buildDiskStorage('book_images'),
  fileFilter: imageFilter,
  limits: { fileSize: maxSize },
}).single('image');