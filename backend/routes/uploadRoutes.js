import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { isAuth } from '../utils.js';

const uploadDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

// ponytail: local-disk storage replaces Cloudinary (repo shipped dummy creds);
// swap back to cloudinary.uploader.upload_stream when real creds exist.
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
    }),
});
const uploadRouter = express.Router();

uploadRouter.post(
    '/',
    isAuth,
    upload.single('file'),
    async (req, res) => {
        res.send({
            secure_url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`,
        });
    }
);
export default uploadRouter;
