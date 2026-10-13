import express from "express";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from 'dotenv';
import seedRouter from "./routes/seedRoutes.js";
import productRouter from "./routes/productRoutes.js";
import userRouter from "./routes/userRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import uploadRouter from "./routes/uploadRoutes.js";

dotenv.config();

// Node 22 crashes on unhandled rejections by default; log instead so a
// transient Mongo hiccup cannot kill the dev server silently.
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
});

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Database Connected');
    })
    .catch((err) => {
        console.log(err.message);
    });

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.use(
    '/uploads',
    express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), 'uploads'))
);

app.use('/api/upload', uploadRouter);
app.use('/api/seed', seedRouter);
app.use('/api/products', productRouter);
app.use('/api/users', userRouter);
app.use('/api/orders', orderRouter);

app.use((err, req, res, next) => {
    res.status(500).send({ message: err.message });
});


const port = process.env.PORT || 9002;
app.listen(port, () => {
    console.log(`serve at http://localhost:${port}`);
})