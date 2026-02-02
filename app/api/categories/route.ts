import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongoose";
import Product from "@/models/Product";

export async function GET() {
  await connectMongo();

  // Group by category and count
  const categories = await Product.aggregate([
    {
      $group: {
        _id: "$category",
        productCount: { $sum: 1 },
        image: { $first: { $arrayElemAt: ["$images", 0] } }, // take first product's first image
      },
    },
    {
      $project: {
        _id: 0,
        name: "$_id",
        productCount: 1,
        image: 1,
      },
    },
  ]);

  return NextResponse.json(categories);
}
