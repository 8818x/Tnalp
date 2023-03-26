import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name: { type: String, unique: true },
        slug: { type: String, unique: true },
        image: { type: String },
        brand: { type: String },
        category: { type: String },
        description: { type: String },
        price: { type: Number },
        countInStock: { type: Number },
        rating: { type: Number },
        numReviews: { type: Number },
    },
    {
        timestamps: true,
    }
);

const Product = mongoose.model('Product', productSchema);

export default Product;