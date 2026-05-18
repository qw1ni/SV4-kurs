import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { badRequest } from '../utils/http';

export const UPLOAD_ROOT = path.resolve(__dirname, '..', '..', 'uploads');
export const AVATAR_DIR = path.join(UPLOAD_ROOT, 'avatars');

if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, AVATAR_DIR);
  },
  filename: (req, file, cb) => {
    const employeeId = req.params.id ?? 'unknown';
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `emp-${employeeId}-${Date.now()}${ext}`);
  },
});

export const uploadAvatar = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 МБ
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIME.has(file.mimetype) || !ALLOWED_EXT.has(ext)) {
      return cb(badRequest('Допустимы только изображения JPG, PNG, WebP, GIF'));
    }
    cb(null, true);
  },
}).single('photo');
