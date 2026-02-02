// app/checkout/success/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Order {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment?: string;
  city: string;
  zipCode: string;
  phone: string;
  shippingMethod: string;
  shippingCost: number;
  paymentMethod: string;
  subtotal: number;
  tax: number;
  total: number;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    images?: string[];
  }[];
  createdAt: string;
}

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const paymentMethod = searchParams.get('method');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect if no orderId
  useEffect(() => {
    if (!orderId) {
      router.push('/cart');
      return;
    }
  }, [orderId, router]);

  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders?orderId=${orderId}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error('Failed to fetch order');
          }
          return res.json();
        })
        .then((data) => {
          if (data.order) {
            setOrder(data.order);
          } else {
            throw new Error('Order not found');
          }
        })
        .catch((err) => {
          console.error('Failed to fetch order:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [orderId]);

  // Format currency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Your Order</h2>
          <p className="text-gray-500">Please wait while we retrieve your order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-4">We couldn't find the order you're looking for.</p>
          <p className="text-sm text-gray-500 mb-6">
            This might happen if the page was refreshed or the order ID is invalid.
          </p>
          <div className="space-y-3">
            <Link
              href="/orders"
              className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              View My Orders
            </Link>
            <Link
              href="/products"
              className="block w-full text-center text-blue-600 py-3 px-4 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors duration-200 font-medium"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {paymentMethod === 'cod' ? 'Order Placed Successfully!' : 'Payment Confirmed!'}
          </h1>
          <p className="text-gray-600 mb-4">
            Thank you for your order. A confirmation email has been sent to {order.email}
          </p>
          
          <div className="inline-flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
            Order ID: <span className="font-mono ml-2">{order._id.slice(-8).toUpperCase()}</span>
          </div>
          
          <p className="text-sm text-gray-500 mt-3">
            Order placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                    <div className="flex items-center">
                      {item.images && item.images[0] && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden mr-4">
                          <Image
                            src={item.images[0]}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                      <p className="text-sm text-gray-500">{formatCurrency(item.price)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Customer</h3>
                  <p className="text-gray-900">{order.firstName} {order.lastName}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Contact</h3>
                  <p className="text-gray-900">{order.email}</p>
                  <p className="text-gray-900">{order.phone}</p>
                </div>
                
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Shipping Address</h3>
                  <p className="text-gray-900">
                    {order.address}
                    {order.apartment && `, ${order.apartment}`}<br />
                    {order.city}, {order.zipCode}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Shipping Method</h3>
                  <p className="text-gray-900 capitalize">{order.shippingMethod.replace(/([A-Z])/g, ' $1').trim()}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Method</h3>
                  <p className="text-gray-900 capitalize">
                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                     order.paymentMethod === 'card' ? 'Credit Card' : 
                     order.paymentMethod}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Total & Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Total</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">
                    {order.shippingCost === 0 ? 'Free' : formatCurrency(order.shippingCost)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">{formatCurrency(order.tax)}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-gray-900 text-lg">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Link
                  href="/products"
                  className="block w-full text-center bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  Continue Shopping
                </Link>

                <Link
                  href="/orders"
                  className="block w-full text-center text-blue-600 py-3 px-4 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors duration-200 font-medium"
                >
                  View Order History
                </Link>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-500">
                  Questions about your order?<br />
                  <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
                    Contact our support team
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}