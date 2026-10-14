import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import dotenv from 'dotenv';
import { isAuth } from '../utils.js';

dotenv.config();

const uploadDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

// Cloudinary is used when real credentials are configured (e.g. on Render);
// otherwise uploads fall back to the local disk so local dev keeps working.
const useCloudinary =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'dummy' &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

const upload = useCloudinary
    ? multer()
    : multer({
          storage: multer.diskStorage({
              destination: (req, file, cb) => cb(null, uploadDir),
              filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
          }),
      });

const uploadRouter = express.Router();

uploadRouter.post('/', isAuth, upload.single('file'), async (req, res) => {
    if (useCloudinary) {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        const streamUpload = (req) =>
            new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream((error, result) => {
                    if (result) resolve(result);
                    else reject(error);
                });
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        const result = await streamUpload(req);
        res.send({ secure_url: result.secure_url });
    } else {
        res.send({
            secure_url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`,
        });
    }
});

export default uploadRouter;
