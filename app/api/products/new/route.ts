import { NextResponse } from "next/server";
import Product from "@/models/Product";
import connectMongo from "@/lib/mongoose";

export async function GET() {
  try {
    await connectMongo();

    // Fetch only the latest 10 products
    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .limit(10);

    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch new arrivals" },
      { status: 500 }
    );
  }
}
