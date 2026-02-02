// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Product from '@/models/Product';
import connectMongo from '@/lib/mongoose';

export async function GET() {
  try {
    await connectMongo();
    const products = await Product.find({});
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongo();
    
    const body = await request.json();
    const { productId, name, description, price, category, image } = body;

    // Validate required fields
    if (!productId || !name || !description || !price || !category || !image) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, name, description, price, category, and image are required' },
        { status: 400 }
      );
    }

    // 🔹 Check if productId already exists
    const existingProduct = await Product.findOne({ productId });
    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product ID already exists.' },
        { status: 400 }
      );
    }

    // Set default values for rating and reviews if not provided
    const productData = {
      ...body,
      rating: body.rating || 0,
      reviews: body.reviews || 0,
    };

    // Create product
    const product = await Product.create(productData);

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);

    // 🔹 Catch Mongo duplicate key errors just in case
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Product ID already exists.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
