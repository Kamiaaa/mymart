import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  productId: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  images: string[];   // ✅ Array of images
  rating: number;
  reviews: number;
  inStock: boolean;
  features: string[];
}

const ProductSchema: Schema = new Schema(
  {
    productId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    category: { type: String, required: true },
    images: [{ type: String, required: true }], // ✅ Array of strings
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    inStock: { type: Boolean, default: true },
    features: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.models.Product ||
  mongoose.model<IProduct>("Product", ProductSchema);
