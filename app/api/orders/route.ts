// app/api/orders/route.ts
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectMongo from '@/lib/mongoose';
import Order from '@/models/Order';

// POST: Create new order
export async function POST(req: Request) {
  try {
    await connectMongo();

    const body = await req.json();

    if (!body.email || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const order = await Order.create({
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      address: body.address,
      apartment: body.apartment,
      city: body.city,
      zipCode: body.zipCode,
      phone: body.phone,
      shippingMethod: body.shippingMethod,
      shippingCost: body.shippingCost,
      paymentMethod: body.paymentMethod,
      items: body.items,
      subtotal: body.subtotal,
      tax: body.tax,
      total: body.total,
      userId: body.userId || null,
    });

    return NextResponse.json({ 
      orderId: order._id,
      message: 'Order created successfully'
    }, { status: 201 });
  } catch (err: any) {
    console.error('Order API Error:', err);
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}

// GET: Fetch order by ID or all orders
export async function GET(req: Request) {
  try {
    await connectMongo();

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    // If orderId is provided, fetch specific order
    if (orderId) {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return NextResponse.json({ error: 'Invalid orderId' }, { status: 400 });
      }

      const order = await Order.findById(orderId).lean();

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Convert MongoDB document to plain object
      const orderData = {
        ...order,
        _id: order._id.toString(),
        createdAt: order.createdAt.toISOString(),
      };

      return NextResponse.json({ order: orderData }, { status: 200 });
    }

    // If no orderId provided, fetch all orders
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    
    // Convert MongoDB documents to plain objects
    const ordersData = orders.map(order => ({
      ...order,
      _id: order._id.toString(),
      createdAt: order.createdAt.toISOString(),
    }));

    return NextResponse.json(ordersData, { status: 200 });
  } catch (err: any) {
    console.error('Order Lookup Error:', err);
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}