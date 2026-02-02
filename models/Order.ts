import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  images: string[];
}

export interface IOrder extends Document {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment?: string;
  city: string;
  zipCode: string;
  phone: string;
  shippingMethod: 'standard' | 'express' | 'priority';
  shippingCost: number;
  paymentMethod: 'card' | 'paypal' | 'applepay' | 'cod';
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status?: string;
  statusUpdatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  images: [{ type: String }],
});

const OrderSchema = new Schema<IOrder>(
  {
    email: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    address: { type: String, required: true },
    apartment: { type: String },
    city: { type: String, required: true },
    zipCode: { type: String, required: true },
    phone: { type: String, required: true },
    shippingMethod: {
      type: String,
      enum: ['standard', 'express', 'priority'],
      required: true,
    },
    shippingCost: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['card', 'paypal', 'applepay', 'cod'],
      required: true,
    },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
      ],
      default: 'pending',
    },
    statusUpdatedAt: { type: Date },
  },
  { timestamps: true }
);

// ✅ Fix: guard against mongoose.models being undefined
const Order: Model<IOrder> =
  mongoose.models?.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
