import { NextRequest, NextResponse } from 'next/server';
import connectMongo from '@/lib/mongoose';
import Order from '@/models/Order';
import { OrderStatus } from '@/app/orders/[id]/page';

export async function POST(request: NextRequest) {
  try {
    const { orderId, status } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    await connectMongo();

    // Update the order status and set the update timestamp
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { 
        status,
        statusUpdatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, order: updatedOrder },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}