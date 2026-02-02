import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectMongo from "@/lib/mongoose";
import Order, { IOrder } from "@/models/Order";
import { notFound } from "next/navigation";
import Image from "next/image";
import OrderStatusUpdate from "@/app/components/OrderStatusUpdate";
import Link from "next/link";

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

// Define status options
export const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-800' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  { value: 'processing', label: 'Processing', color: 'bg-purple-100 text-purple-800' },
  { value: 'shipped', label: 'Shipped', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
] as const;

export type OrderStatus = typeof ORDER_STATUSES[number]['value'];

// Payment status mapping with static Tailwind classes
const PAYMENT_STATUS_CONFIG = {
  paid: { label: 'Paid', textColor: 'text-green-800', bgColor: 'bg-green-100' },
  pending: { label: 'Pending', textColor: 'text-amber-800', bgColor: 'bg-amber-100' },
  default: { label: 'Pending', textColor: 'text-gray-800', bgColor: 'bg-gray-100' }
} as const;

// Extend the IOrder interface to include status fields
interface IOrderWithStatus extends IOrder {
  status?: OrderStatus;
  statusUpdatedAt?: Date;
}

export default async function OrderDetailsPage({ params }: OrderPageProps) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">Please log in to view this order.</p>
          <Link 
            href="/login" 
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors block text-center"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  // Await the params object before using its properties
  const { id } = await params;
  await connectMongo();

  // Find the order with proper typing
  const order = await Order.findById(id).lean() as IOrderWithStatus | null;

  if (!order) {
    notFound();
  }

  // Check if the order belongs to the logged-in customer (unless admin)
  if (order.email !== session.user.email && session.user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to view this order.</p>
          <Link 
            href="/orders" 
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors block text-center"
          >
            Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  // Calculate values based on your actual schema
  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Determine payment status with static Tailwind classes
  const getPaymentStatus = () => {
    switch (order.paymentMethod) {
      case 'card':
      case 'paypal':
      case 'applepay':
        return PAYMENT_STATUS_CONFIG.paid;
      case 'cod':
        return PAYMENT_STATUS_CONFIG.pending;
      default:
        return PAYMENT_STATUS_CONFIG.default;
    }
  };

  const paymentStatus = getPaymentStatus();

  // Get current order status with fallback to 'pending'
  const currentStatus = order.status || 'pending';
  const statusInfo = ORDER_STATUSES.find(s => s.value === currentStatus) || ORDER_STATUSES[0];

  // Format currency function with larger Taka sign
  const formatCurrency = (amount: number) => {
    return (
      <span className="flex items-baseline">
        <span className="text-2xl font-bold mr-0.5">৳</span>
        <span>{amount.toFixed(2)}</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
              <p className="text-gray-500 mt-1">Order ID: #{String(order._id).slice(-8).toUpperCase()}</p>
            </div>
            <div className="flex space-x-2">
              <Link 
                href="/orders"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Orders
              </Link>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Print
              </button>
              {/* Only show OrderStatusUpdate for admin users */}
              {session.user.role === 'admin' && (
                <OrderStatusUpdate 
                  orderId={String(order._id)} 
                  currentStatus={currentStatus} 
                />
              )}
            </div>
          </div>
          <div className="mt-4 flex items-center flex-wrap gap-2">
            <div className={`px-3 py-1 rounded-full ${statusInfo.color} text-sm font-medium`}>
              {statusInfo.label}
            </div>
            <div className={`px-3 py-1 rounded-full ${paymentStatus.bgColor} ${paymentStatus.textColor} text-sm font-medium`}>
              Payment: {paymentStatus.label}
            </div>
            <div className="ml-4 text-sm text-gray-500">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Summary Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Customer</h3>
                    <p className="text-gray-900">{order.firstName} {order.lastName}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Contact</h3>
                    <p className="text-gray-900">{order.email}</p>
                    {order.phone && <p className="text-gray-900">{order.phone}</p>}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Shipping Address</h3>
                  <p className="text-gray-900">
                    {order.address}
                    {order.apartment && `, ${order.apartment}`}<br />
                    {order.city}, {order.zipCode}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Shipping Method</h3>
                    <p className="text-gray-900 capitalize">{order.shippingMethod}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Method</h3>
                    <p className="text-gray-900 capitalize">{order.paymentMethod}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
              
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                    <div className="flex items-center">
                      {item.images && item.images[0] && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden mr-4">
                          <Image
                            src={item.images[0]}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">SKU: {item.productId || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(item.price)}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Summary Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">{formatCurrency(order.shippingCost)}</span>
                </div>
                
                {order.tax > 0 && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900">{formatCurrency(order.tax)}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between items-baseline">
                    <span className="font-medium text-gray-900">Total</span>
                    <span className="font-bold text-gray-900 text-lg">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Payment Status</h3>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    paymentStatus.textColor.replace('text-', 'bg-').replace('-800', '-500')
                  }`}></div>
                  <span className={`text-sm font-medium ${paymentStatus.textColor}`}>
                    {paymentStatus.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {order.paymentMethod === 'cod' 
                    ? 'Payment will be collected upon delivery' 
                    : 'Payment processed successfully'}
                </p>
              </div>

              {/* Status History */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Status History</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Order Placed</span>
                    <span className="text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {order.statusUpdatedAt && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status Updated</span>
                      <span className="text-gray-500">
                        {new Date(order.statusUpdatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Actions */}
              {session.user.role !== 'admin' && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Need Help?</h3>
                  <div className="space-y-2">
                    <button className="w-full text-left text-sm text-blue-600 hover:text-blue-800 py-1">
                      Contact Support
                    </button>
                    <button className="w-full text-left text-sm text-blue-600 hover:text-blue-800 py-1">
                      Request Return
                    </button>
                    {order.status === 'delivered' && (
                      <button className="w-full text-left text-sm text-blue-600 hover:text-blue-800 py-1">
                        Write a Review
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}