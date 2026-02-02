// app/api/wishlist/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Wishlist from '@/models/Wishlist';
import connectMongo from '@/lib/mongoose';

export async function GET() {
  try {
    await connectMongo();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wishlist = await Wishlist.findOne({ userId: session.user.id })
      .populate('items.productId')
      .exec();

    if (!wishlist) {
      return NextResponse.json({ items: [] });
    }

    const items = wishlist.items.map((item: any) => ({
      ...item.productId.toObject(),
      addedAt: item.addedAt
    }));

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongo();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await request.json();

    let wishlist = await Wishlist.findOne({ userId: session.user.id });

    if (!wishlist) {
      wishlist = new Wishlist({
        userId: session.user.id,
        items: [{ productId }]
      });
    } else {
      // Check if product already exists in wishlist
      const existingItem = wishlist.items.find(
        (item: any) => item.productId.toString() === productId
      );

      if (existingItem) {
        return NextResponse.json(
          { error: 'Product already in wishlist' },
          { status: 400 }
        );
      }

      wishlist.items.push({ productId });
    }

    await wishlist.save();
    await wishlist.populate('items.productId');

    const items = wishlist.items.map((item: any) => ({
      ...item.productId.toObject(),
      addedAt: item.addedAt
    }));

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectMongo();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    const wishlist = await Wishlist.findOne({ userId: session.user.id });

    if (!wishlist) {
      return NextResponse.json({ error: 'Wishlist not found' }, { status: 404 });
    }

    if (productId) {
      // Remove specific product
      wishlist.items = wishlist.items.filter(
        (item: any) => item.productId.toString() !== productId
      );
    } else {
      // Clear entire wishlist
      wishlist.items = [];
    }

    await wishlist.save();
    await wishlist.populate('items.productId');

    const items = wishlist.items.map((item: any) => ({
      ...item.productId.toObject(),
      addedAt: item.addedAt
    }));

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}