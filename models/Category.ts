// models/Category.ts
import mongoose, { Schema, Document, models, model } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentCategory?: string;
  isActive: boolean;
}

const CategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    image: { type: String },
    parentCategory: { type: String, ref: "Category" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default models.Category || model<ICategory>("Category", CategorySchema);