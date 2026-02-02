import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectMongo from '@/lib/mongoose';
import Order from '@/models/Order';

interface OrderParams {
  params: Promise<{ id: string }>;
}

const transformOrderData = (order: any) => ({
  ...order,
  _id: order._id.toString(),
  createdAt: order.createdAt.toISOString(),
  updatedAt: order.updatedAt.toISOString(),
  ...(order.statusUpdatedAt && { 
    statusUpdatedAt: order.statusUpdatedAt.toISOString() 
  }),
  ...(order.userId && { userId: order.userId.toString() })
});

export async function GET(req: Request, { params }: OrderParams) {
  try {
    await connectMongo();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' }, 
        { status: 400 }
      );
    }

    const order = await Order.findById(id)
      .populate('userId', 'name email')
      .populate('items.productId', 'name price')
      .lean();

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = transformOrderData(order);
    return NextResponse.json({ 
      success: true, 
      data: orderData 
    });
  } catch (err: any) {
    console.error('Order GET Error:', err);
    return NextResponse.json(
      { 
        success: false, 
        error: err.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: OrderParams) {
  try {
    await connectMongo();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' }, 
        { status: 400 }
      );
    }

    const body = await req.json();
    const { status, notes } = body;

    if (status) {
      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid order status' },
          { status: 400 }
        );
      }
    }

    const updateData: any = { 
      ...body,
      updatedAt: new Date() 
    };
    
    if (status) {
      updateData.statusUpdatedAt = new Date();
    }

    const order = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('userId', 'name email')
    .lean();

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = transformOrderData(order);
    return NextResponse.json({ 
      success: true, 
      data: orderData,
      message: 'Order updated successfully'
    });
  } catch (err: any) {
    console.error('Order PUT Error:', err);
    
    if (err.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: err.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: OrderParams) {
  try {
    await connectMongo();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' }, 
        { status: 400 }
      );
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status: 'cancelled', updatedAt: new Date() },
      { new: true }
    );

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Order cancelled successfully',
      data: { id: order._id.toString(), status: order.status }
    });
  } catch (err: any) {
    console.error('Order DELETE Error:', err);
    return NextResponse.json(
      { 
        success: false, 
        error: err.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}