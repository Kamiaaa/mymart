// app/checkout/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/app/context/CartContext';
import { useSession } from 'next-auth/react';

interface FormData {
    email: string;
    firstName: string;
    lastName: string;
    address: string;
    apartment: string;
    city: string;
    zipCode: string;
    phone: string;
    saveInfo: boolean;
    shippingMethod: 'standard' | 'express' | 'priority';
    paymentMethod: 'card' | 'paypal' | 'applepay' | 'cod';
    cardNumber: string;
    cardName: string;
    cardExpiry: string;
    cardCvc: string;
}

interface UserData {
    name: string;
    email: string;
    phone?: string;
    addresses?: Array<{
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
        phone?: string;
        isDefault: boolean;
    }>;
}

export default function CheckoutPage() {
    const { cartItems, getCartTotal, clearCart } = useCart();
    const { data: session, status } = useSession();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [activeStep, setActiveStep] = useState(1);
    const [isProcessingOrder, setIsProcessingOrder] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<FormData>({
        email: '',
        firstName: '',
        lastName: '',
        address: '',
        apartment: '',
        city: '',
        zipCode: '',
        phone: '',
        saveInfo: false,
        shippingMethod: 'standard',
        paymentMethod: 'cod',
        cardNumber: '',
        cardName: '',
        cardExpiry: '',
        cardCvc: '',
    });

    // Calculate shipping cost based on location and order total
    const isDhakaCity = formData.city.toLowerCase().includes('dhaka');
    const freeShippingThreshold = 3000;
    const dhakaShippingCharge = 80;
    const outsideDhakaShippingCharge = 120;

    // Calculate shipping cost
    let shippingCost = 0;
    if (getCartTotal() < freeShippingThreshold) {
        shippingCost = isDhakaCity ? dhakaShippingCharge : outsideDhakaShippingCharge;
    }

    // Add premium for express/priority shipping
    if (formData.shippingMethod === 'express') {
        shippingCost += 50;
    } else if (formData.shippingMethod === 'priority') {
        shippingCost += 100;
    }

    // Calculate totals
    const subtotal = getCartTotal();
    const tax = subtotal * 0.08;
    const total = subtotal + shippingCost + tax;

    // Fetch user data if logged in
    useEffect(() => {
        const fetchUserData = async () => {
            if (status === 'authenticated' && session?.user?.email) {
                try {
                    const response = await fetch('/api/users/me');
                    if (response.ok) {
                        const userData = await response.json();
                        setUserData(userData);

                        // Pre-fill form with user data
                        const nameParts = userData.name.split(' ');
                        const defaultAddress = userData.addresses?.find((addr: any) => addr.isDefault);

                        setFormData(prev => ({
                            ...prev,
                            email: userData.email || '',
                            firstName: nameParts[0] || '',
                            lastName: nameParts.slice(1).join(' ') || '',
                            phone: userData.phone || defaultAddress?.phone || '',
                            ...(defaultAddress && {
                                address: defaultAddress.street || '',
                                city: defaultAddress.city || '',
                                zipCode: defaultAddress.zipCode || '',
                            })
                        }));
                    }
                } catch (error) {
                    console.error('Failed to fetch user data:', error);
                }
            }
        };

        if (status === 'authenticated') {
            fetchUserData();
        }
    }, [status, session]);

    // Redirect if cart is empty and not processing order
    useEffect(() => {
        if (cartItems.length === 0 && !isProcessingOrder && activeStep === 1) {
            router.push('/cart');
        }
    }, [cartItems, isProcessingOrder, activeStep, router]);

    // Auto-update shipping when city or shipping method changes
    useEffect(() => {
        // This effect will trigger re-renders when dependencies change
    }, [formData.city, formData.shippingMethod, subtotal]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox'
                ? (e.target as HTMLInputElement).checked
                : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setIsProcessingOrder(true);
        setError(null);

        // Basic validation
        if (!formData.email || !formData.firstName || !formData.lastName ||
            !formData.address || !formData.city || !formData.zipCode || !formData.phone) {
            setError('Please fill in all required fields');
            setLoading(false);
            setIsProcessingOrder(false);
            return;
        }

        try {
            // Prepare order data
            const orderData = {
                email: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                address: formData.address,
                apartment: formData.apartment,
                city: formData.city,
                zipCode: formData.zipCode,
                phone: formData.phone,
                shippingMethod: formData.shippingMethod,
                paymentMethod: formData.paymentMethod,
                items: cartItems.map(item => ({
                    productId: item.productId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    images: item.images || []
                })),
                subtotal,
                shippingCost,
                tax,
                total,
                userId: session?.user?.id || null,
                saveInfo: formData.saveInfo && !!session?.user?.id,
                isDhakaCity: formData.city.toLowerCase().includes('dhaka'),
                freeShippingApplied: subtotal >= freeShippingThreshold
            };

            console.log('Submitting order:', orderData);

            // Save order to database
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create order');
            }

            const result = await response.json();
            const orderId = result.orderId;

            // Save address to user profile if requested and logged in
            if (formData.saveInfo && session?.user?.id) {
                try {
                    await fetch('/api/users/address', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            street: formData.address,
                            city: formData.city,
                            state: 'Bangladesh',
                            zipCode: formData.zipCode,
                            country: 'Bangladesh',
                            phone: formData.phone,
                            isDefault: true
                        }),
                    });
                } catch (error) {
                    console.error('Failed to save address:', error);
                    // Don't fail the order if address saving fails
                }
            }

            // Clear cart first
            clearCart();

            // Redirect to success page
            router.push(`/checkout/success?orderId=${orderId}&total=${total.toFixed(2)}&method=${formData.paymentMethod}`);

        } catch (error) {
            console.error('Order processing failed:', error);
            setError(error instanceof Error ? error.message : 'Failed to process order. Please try again.');
            setIsProcessingOrder(false);
        } finally {
            setLoading(false);
        }
    };

    // Show processing state
    if (isProcessingOrder) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Your Order</h2>
                    <p className="text-gray-600">Please wait while we confirm your payment...</p>
                </div>
            </div>
        );
    }

    // Show loading state if cart is being processed or empty
    if (cartItems.length === 0 && !isProcessingOrder) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8">
                <div className="container mx-auto px-4">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
                        <p className="mt-3 text-gray-600 font-medium">
                            Redirecting to cart...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
                    <p className="text-gray-600 mt-2">Complete your purchase</p>

                    {/* User Info Banner */}
                    {session && (
                        <div className="max-w-md mx-auto mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-center text-sm text-green-800">
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Signed in as {session.user?.name} • Information pre-filled
                            </div>
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error</h3>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Progress Steps */}
                <div className="max-w-4xl mx-auto mb-8">
                    <div className="flex justify-between items-center">
                        {[1, 2, 3].map((step) => (
                            <div key={step} className="flex items-center">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center ${activeStep >= step
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-200 text-gray-600'
                                        }`}
                                >
                                    {step}
                                </div>
                                {step < 3 && (
                                    <div
                                        className={`w-16 h-1 mx-2 ${activeStep > step ? 'bg-indigo-600' : 'bg-gray-200'
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-gray-600">
                        <span className={activeStep >= 1 ? 'text-indigo-600 font-medium' : ''}>
                            Information
                        </span>
                        <span className={activeStep >= 2 ? 'text-indigo-600 font-medium' : ''}>
                            Shipping
                        </span>
                        <span className={activeStep >= 3 ? 'text-indigo-600 font-medium' : ''}>
                            Payment
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    {/* Checkout Form */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* STEP 1: Information */}
                            {activeStep === 1 && (
                                <>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                        Contact Information
                                    </h2>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email address"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                        required
                                        disabled={!!session}
                                    />
                                    {session && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            Email cannot be changed while signed in
                                        </p>
                                    )}

                                    <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-4">
                                        Shipping Address
                                    </h2>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <input
                                            type="text"
                                            name="firstName"
                                            placeholder="First name"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                            required
                                        />
                                        <input
                                            type="text"
                                            name="lastName"
                                            placeholder="Last name"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                            required
                                        />
                                    </div>

                                    <input
                                        type="text"
                                        name="address"
                                        placeholder="Address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 mb-4"
                                        required
                                    />

                                    <input
                                        type="text"
                                        name="apartment"
                                        placeholder="Apartment, suite, etc. (optional)"
                                        value={formData.apartment}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 mb-4"
                                    />

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <input
                                            type="text"
                                            name="city"
                                            placeholder="City (e.g., Dhaka, Chittagong)"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                            required
                                        />
                                        <input
                                            type="text"
                                            name="zipCode"
                                            placeholder="ZIP code"
                                            value={formData.zipCode}
                                            onChange={handleInputChange}
                                            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                            required
                                        />
                                    </div>

                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="Phone number"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                        required
                                    />

                                    <div className="p-3 bg-blue-50 rounded-lg mt-4">
                                        <p className="text-sm text-blue-800">
                                            💡 <strong>Shipping Note:</strong> Free shipping on orders over ৳3000. 
                                            Dhaka city: ৳80, Outside Dhaka: ৳120
                                        </p>
                                    </div>

                                    {session && (
                                        <label className="flex items-center mt-4">
                                            <input
                                                type="checkbox"
                                                name="saveInfo"
                                                checked={formData.saveInfo}
                                                onChange={handleInputChange}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-600">
                                                Save this address to my profile
                                            </span>
                                        </label>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setActiveStep(2)}
                                        className="w-full bg-indigo-600 text-white py-3 rounded-lg mt-6 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!formData.email || !formData.firstName || !formData.lastName || !formData.address || !formData.city || !formData.zipCode || !formData.phone}
                                    >
                                        Continue to Shipping
                                    </button>
                                </>
                            )}

                            {/* STEP 2: Shipping */}
                            {activeStep === 2 && (
                                <>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                        Shipping Method
                                    </h2>
                                    <div className="space-y-3">
                                        {[
                                            { 
                                                id: 'standard', 
                                                name: 'Standard Shipping', 
                                                price: subtotal >= freeShippingThreshold ? 'Free' : (isDhakaCity ? '৳80' : '৳120'), 
                                                time: isDhakaCity ? '1-2 business days' : '3-5 business days' 
                                            },
                                            { 
                                                id: 'express', 
                                                name: 'Express Shipping', 
                                                price: subtotal >= freeShippingThreshold ? '৳50' : (isDhakaCity ? '৳130' : '৳170'), 
                                                time: isDhakaCity ? 'Same day delivery' : '1-2 business days' 
                                            },
                                            { 
                                                id: 'priority', 
                                                name: 'Priority Shipping', 
                                                price: subtotal >= freeShippingThreshold ? '৳100' : (isDhakaCity ? '৳180' : '৳220'), 
                                                time: isDhakaCity ? 'Within 4 hours' : 'Next business day' 
                                            },
                                        ].map((method) => (
                                            <label key={method.id} className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500">
                                                <input
                                                    type="radio"
                                                    name="shippingMethod"
                                                    value={method.id}
                                                    checked={formData.shippingMethod === method.id}
                                                    onChange={handleInputChange}
                                                    className="text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <div className="ml-3 flex-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-900 font-medium">{method.name}</span>
                                                        <span className="text-gray-900">{method.price}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600">{method.time}</p>
                                                    {subtotal >= freeShippingThreshold && method.id === 'standard' && (
                                                        <p className="text-sm text-green-600 font-medium">Free shipping applied! 🎉</p>
                                                    )}
                                                    {subtotal >= freeShippingThreshold && method.id !== 'standard' && (
                                                        <p className="text-sm text-green-600">Free standard shipping + premium</p>
                                                    )}
                                                </div>
                                            </label>
                                        ))}
                                    </div>

                                    <div className="p-3 bg-gray-50 rounded-lg mt-4">
                                        <p className="text-sm text-gray-600">
                                            <strong>Location:</strong> {formData.city || 'Not specified'} 
                                            {formData.city && (
                                                <span className={isDhakaCity ? 'text-green-600 font-medium' : 'text-blue-600 font-medium'}>
                                                    {isDhakaCity ? ' (Dhaka City - ৳80 base)' : ' (Outside Dhaka - ৳120 base)'}
                                                </span>
                                            )}
                                        </p>
                                        {subtotal < freeShippingThreshold && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                <strong>Free Shipping:</strong> Add ৳{(freeShippingThreshold - subtotal).toFixed(0)} more to qualify!
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex justify-between mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setActiveStep(1)}
                                            className="px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveStep(3)}
                                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                        >
                                            Continue to Payment
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* STEP 3: Payment */}
                            {activeStep === 3 && (
                                <>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                        Payment Method
                                    </h2>
                                    <div className="space-y-3 mb-4">
                                        {[
                                            { id: 'cod', name: 'Cash on Delivery', icon: '💰', description: 'Pay when you receive your order' },
                                            { id: 'card', name: 'Credit Card', icon: '💳', description: 'Pay with credit or debit card' },
                                            { id: 'paypal', name: 'PayPal', icon: '📧', description: 'Pay with your PayPal account' },
                                            { id: 'applepay', name: 'Apple Pay', icon: '🍎', description: 'Pay with Apple Pay' },
                                        ].map((method) => (
                                            <label key={method.id} className="flex items-start p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500">
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value={method.id}
                                                    checked={formData.paymentMethod === method.id}
                                                    onChange={handleInputChange}
                                                    className="text-indigo-600 focus:ring-indigo-500 mt-1"
                                                />
                                                <div className="ml-3 flex-1">
                                                    <div className="flex items-center">
                                                        <span className="text-gray-900 font-medium">{method.icon} {method.name}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>

                                    {formData.paymentMethod === 'card' && (
                                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                                            <input
                                                type="text"
                                                name="cardNumber"
                                                placeholder="Card number"
                                                value={formData.cardNumber}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                                required
                                            />
                                            <input
                                                type="text"
                                                name="cardName"
                                                placeholder="Name on card"
                                                value={formData.cardName}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                                required
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <input
                                                    type="text"
                                                    name="cardExpiry"
                                                    placeholder="MM/YY"
                                                    value={formData.cardExpiry}
                                                    onChange={handleInputChange}
                                                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                                    required
                                                />
                                                <input
                                                    type="text"
                                                    name="cardCvc"
                                                    placeholder="CVC"
                                                    value={formData.cardCvc}
                                                    onChange={handleInputChange}
                                                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setActiveStep(2)}
                                            className="px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? 'Processing...' : `Place Order - ৳${total.toFixed(2)}`}
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Order Summary ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
                            </h2>

                            {/* Cart Items */}
                            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                                {cartItems.map((item) => (
                                    <div key={item.productId} className="flex items-center space-x-3">
                                        <div className="flex-shrink-0 w-16 h-16 relative bg-gray-100 rounded-lg">
                                            <Image
                                                src={item.images?.[0] || '/placeholder.png'}
                                                alt={item.name}
                                                fill
                                                className="rounded-lg object-cover"
                                            />
                                            <div className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                                {item.quantity}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-medium text-gray-900 truncate">
                                                {item.name}
                                            </h3>
                                            <p className="text-sm text-gray-600">৳{item.price.toFixed(2)}</p>
                                        </div>
                                        <div className="text-sm font-medium text-gray-900">
                                            ৳{(item.price * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Free Shipping Progress */}
                            {subtotal < freeShippingThreshold && (
                                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                    <div className="flex justify-between text-sm text-blue-800 mb-1">
                                        <span>Free shipping on orders over ৳3000</span>
                                        <span>৳{subtotal.toFixed(0)}/৳3000</span>
                                    </div>
                                    <div className="w-full bg-blue-200 rounded-full h-2">
                                        <div 
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min((subtotal / freeShippingThreshold) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-blue-600 mt-1">
                                        Add ৳{(freeShippingThreshold - subtotal).toFixed(0)} more for free shipping!
                                    </p>
                                </div>
                            )}

                            {subtotal >= freeShippingThreshold && (
                                <div className="mb-4 p-3 bg-green-50 rounded-lg">
                                    <div className="flex items-center text-sm text-green-800">
                                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Congratulations! You qualify for free shipping!
                                    </div>
                                </div>
                            )}

                            {/* Location Info */}
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">
                                    <strong>Shipping to:</strong> {formData.city || 'Not specified'}
                                    {formData.city && (
                                        <span className={isDhakaCity ? 'text-green-600 font-medium' : 'text-blue-600 font-medium'}>
                                            {isDhakaCity ? ' (Dhaka City)' : ' (Outside Dhaka)'}
                                        </span>
                                    )}
                                </p>
                            </div>

                            {/* Order Total */}
                            <div className="space-y-3 border-t border-gray-200 pt-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium">৳{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Shipping</span>
                                    <span className="font-medium">
                                        {shippingCost === 0 ? 'Free' : `৳${shippingCost.toFixed(2)}`}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Tax</span>
                                    <span className="font-medium">৳{tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-3">
                                    <span>Total</span>
                                    <span>৳{total.toFixed(2)}</span>
                                </div>
                            </div>

                            <Link
                                href="/products"
                                className="block w-full text-center text-indigo-600 py-3 px-4 rounded-lg border border-indigo-600 hover:bg-indigo-50 mt-6 transition-colors duration-200"
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