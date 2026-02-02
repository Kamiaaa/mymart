// app/api/products/[id]/route.ts
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Product from "@/models/Product";
import connectMongo from "@/lib/mongoose";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongo();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product identifier is required' },
        { status: 400 }
      );
    }

    let product;
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id)
        .populate('category', 'name slug');
    } else {
      product = await Product.findOne({ 
        $or: [
          { productId: id },
          { slug: id },
          { sku: id }
        ]
      }).populate('category', 'name slug');
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Convert to plain object and ensure price is a valid number
    const productData = {
      ...product.toObject(),
      _id: product._id.toString(),
      price: typeof product.price === 'number' ? product.price : 0,
      originalPrice: typeof product.originalPrice === 'number' ? product.originalPrice : undefined,
      rating: typeof product.rating === 'number' ? product.rating : 0,
      reviews: typeof product.reviews === 'number' ? product.reviews : 0,
      category: product.category && product.category._id ? {
        _id: product.category._id.toString(),
        name: product.category.name,
        slug: product.category.slug
      } : null
    };

    return NextResponse.json(productData); // Return just the data, not wrapped
  } catch (error: any) {
    console.error('Product GET Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongo();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product identifier is required' },
        { status: 400 }
      );
    }

    const body = await req.json();
    
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Product name is required' },
        { status: 400 }
      );
    }

    if (body.price && body.price < 0) {
      return NextResponse.json(
        { success: false, error: 'Price cannot be negative' },
        { status: 400 }
      );
    }

    let product;
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findByIdAndUpdate(
        id,
        { ...body, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate('category', 'name slug');
    } else {
      product = await Product.findOneAndUpdate(
        { 
          $or: [
            { productId: id },
            { slug: id },
            { sku: id }
          ]
        },
        { ...body, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate('category', 'name slug');
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Convert to plain object safely
    const productData = {
      ...product.toObject(),
      _id: product._id.toString(),
      category: product.category && product.category._id ? {
        _id: product.category._id.toString(),
        name: product.category.name,
        slug: product.category.slug
      } : null
    };

    return NextResponse.json({ 
      success: true, 
      data: productData,
      message: 'Product updated successfully'
    });
  } catch (error: any) {
    console.error('Product PUT Error:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Duplicate product ID, SKU, or slug' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongo();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product identifier is required' },
        { status: 400 }
      );
    }

    let product;
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findByIdAndDelete(id);
    } else {
      product = await Product.findOneAndDelete({
        $or: [
          { productId: id },
          { slug: id },
          { sku: id }
        ]
      });
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Product deleted successfully',
      data: { id: product._id.toString() }
    });
  } catch (error: any) {
    console.error('Product DELETE Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}