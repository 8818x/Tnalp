// One-time DB bootstrap: run `node seed.js` from backend/.
// (GET /api/seed is admin-guarded now, so a fresh empty DB cannot seed itself.)
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import data from './data.js';
import Product from './models/productModel.js';
import User from './models/userModel.js';

dotenv.config();

try {
    await mongoose.connect(process.env.MONGODB_URI);
    await Product.deleteMany({});
    await Product.insertMany(data.products);
    await User.deleteMany({});
    await User.insertMany(data.users);
    console.log(`Seeded ${data.products.length} products, ${data.users.length} users`);
    await mongoose.disconnect();
} catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
}
