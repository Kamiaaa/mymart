// app/cart/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
  const router = useRouter();

  // Format currency function with larger Taka sign
  const formatCurrency = (amount: number) => {
    return (
      <span className="flex items-baseline">
        <span className="text-2xl font-bold mr-0.5">৳</span>
        <span>{amount.toFixed(2)}</span>
      </span>
    );
  };

  // Function to handle image errors
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = '/placeholder.png';
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>
            <div className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h2 className="mt-4 text-xl font-medium text-gray-900">Your cart is empty</h2>
              <p className="mt-2 text-gray-500">Start shopping to add items to your cart.</p>
              <div className="mt-6">
                <Link
                  href="/products"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">Cart Items ({cartItems.length})</h2>
                <button
                  onClick={clearCart}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Clear Cart
                </button>
              </div>
              
              <div className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <div key={item.productId} className="py-6 flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 relative">
                        <Image
                          src={item.images && item.images.length > 0 ? item.images[0] : '/placeholder.png'}
                          alt={item.name}
                          fill
                          className="rounded-md object-cover"
                          onError={handleImageError}
                        />
                      </div>
                    </div>
                    
                    <div className="ml-4 flex-1">
                      <h3 className="text-md font-medium text-gray-900">{item.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">Product ID: {item.productId}</p>
                      <p className="mt-1 text-sm font-medium text-gray-900">{formatCurrency(item.price)}</p>
                      <p className="mt-1 text-xs text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="px-3 py-1 text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 bg-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="px-3 py-1 text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                      
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-600 hover:text-red-800 ml-4"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(getCartTotal())}</span>
                </div>
                
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">৳0.00</span>
                </div>
                
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">{formatCurrency(getCartTotal() * 0.08)}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-4 flex justify-between items-baseline">
                  <span className="text-lg font-medium text-gray-900">Total</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(getCartTotal() * 1.08)}
                  </span>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => router.push('/checkout')}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Proceed to Checkout
                </button>
                
                <Link
                  href="/products"
                  className="block w-full text-center text-indigo-600 py-3 px-4 rounded-lg border border-indigo-600 hover:bg-indigo-50"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}