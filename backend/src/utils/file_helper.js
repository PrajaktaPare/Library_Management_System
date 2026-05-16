import fs from 'fs';
import path from 'path';

class FileHelper {
  static deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  static getFileExtension(filename) {
    return path.extname(filename).toLowerCase().slice(1);
  }

  static isValidFileType(filename, allowedTypes = ['jpg', 'jpeg', 'png', 'pdf']) {
    const ext = this.getFileExtension(filename);
    return allowedTypes.includes(ext);
  }

  static generateUniqueFilename(originalFilename) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const ext = path.extname(originalFilename);
    const name = path.basename(originalFilename, ext);
    return `${name}_${timestamp}_${random}${ext}`;
  }

  static ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}

export default FileHelper;
