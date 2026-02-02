// app/account/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiEdit,
  FiSave,
  FiX,
  FiLock,
  FiShoppingBag,
  FiHeart,
  FiSettings,
  FiBell,
  FiShield,
  FiCreditCard,
  FiTruck,
  FiStar,
  FiMessageSquare,
  FiPackage,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiBox,
  FiPlus,
  FiTrash2,
  FiRefreshCw,
} from "react-icons/fi";

interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  images: string[];
}

interface IOrder {
  _id: string;
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
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  statusUpdatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface UserAddress {
  _id?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  label: 'home' | 'work' | 'other';
  phone?: string;
}

interface WishlistItem {
  _id?: string;
  productId: string;
  addedAt: string;
  productDetails?: {
    _id: string;
    name: string;
    price: number;
    images: string[];
    category: string;
    slug: string;
  };
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  addresses: UserAddress[];
  wishlist: WishlistItem[];
  preferences: {
    newsletter: boolean;
    smsNotifications: boolean;
    emailNotifications: boolean;
    productRecommendations: boolean;
  };
}

// Taka sign component
const TakaSign = ({ className = "" }: { className?: string }) => (
  <span className={`font-bold ${className}`}>৳</span>
);

const AccountPage = () => {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("orders");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
  });
  const [saveMessage, setSaveMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // Address Book States
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Bangladesh',
    label: 'home' as 'home' | 'work' | 'other',
    phone: '',
    isDefault: false
  });

  // Wishlist States
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load all data when component mounts or session changes
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    loadAllData();
  }, [session, status, router]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadProfile(),
        loadOrders(),
        loadWishlist()
      ]);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await loadAllData();
      setSaveMessage({ type: 'success', message: 'Data refreshed successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage({ type: 'error', message: 'Failed to refresh data' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/users/profile');
      if (response.ok) {
        const userData = await response.json();
        
        const transformedProfile: UserProfile = {
          id: userData._id || userData.id,
          name: userData.name || session?.user?.name || '',
          email: userData.email || session?.user?.email || '',
          phone: userData.phone || '',
          dateOfBirth: userData.dateOfBirth ? 
            new Date(userData.dateOfBirth).toISOString().split('T')[0] : '',
          gender: userData.gender || '',
          addresses: userData.addresses || [],
          wishlist: userData.wishlist || [],
          preferences: userData.preferences || {
            newsletter: true,
            smsNotifications: false,
            emailNotifications: true,
            productRecommendations: true,
          }
        };
        
        setProfile(transformedProfile);
        setAddresses(transformedProfile.addresses || []);
        setFormData({
          name: transformedProfile.name,
          email: transformedProfile.email,
          phone: transformedProfile.phone,
          dateOfBirth: transformedProfile.dateOfBirth,
          gender: transformedProfile.gender,
        });
      } else {
        throw new Error('Failed to load profile');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Set fallback profile data
      const fallbackProfile: UserProfile = {
        id: session?.user?.id || "1",
        name: session?.user?.name || "User",
        email: session?.user?.email || "",
        phone: "",
        dateOfBirth: "",
        gender: "",
        addresses: [],
        wishlist: [],
        preferences: {
          newsletter: true,
          smsNotifications: false,
          emailNotifications: true,
          productRecommendations: true,
        },
      };
      setProfile(fallbackProfile);
      setAddresses([]);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/orders/my-orders');
      if (response.ok) {
        const ordersData = await response.json();
        setOrders(ordersData);
      } else {
        // If API fails, use mock data for demonstration
        setOrders(generateMockOrders(session?.user?.email || ''));
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders(generateMockOrders(session?.user?.email || ''));
    }
  };

  const loadWishlist = async () => {
    setIsWishlistLoading(true);
    try {
      const response = await fetch('/api/users/wishlist');
      if (response.ok) {
        const data = await response.json();
        setWishlist(data.wishlist || []);
      } else {
        console.error('Failed to load wishlist');
        setWishlist([]);
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
      setWishlist([]);
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      const response = await fetch(`/api/users/wishlist?productId=${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh wishlist data
        await loadWishlist();
        setSaveMessage({ type: 'success', message: 'Product removed from wishlist' });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove from wishlist');
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      setSaveMessage({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to remove from wishlist' 
      });
    }
  };

  const addToCartFromWishlist = async (product: WishlistItem['productDetails']) => {
    if (!product) return;

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product._id,
          quantity: 1,
        }),
      });

      if (response.ok) {
        setSaveMessage({ type: 'success', message: 'Product added to cart' });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setSaveMessage({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to add to cart' 
      });
    }
  };

  // Function to generate MongoDB-like ObjectId format
  const generateObjectId = () => {
    const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
    const random = Array(16)
      .fill(0)
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('');
    return timestamp + random;
  };

  const generateMockOrders = (email: string): IOrder[] => {
    return [
      {
        _id: generateObjectId(),
        email: email,
        firstName: "John",
        lastName: "Doe",
        address: "123 Main Street",
        apartment: "Apt 4B",
        city: "Dhaka",
        zipCode: "1212",
        phone: "+880 1XXX-XXXXXX",
        shippingMethod: "express",
        shippingCost: 120,
        paymentMethod: "card",
        items: [
          {
            productId: "101",
            name: "Wireless Bluetooth Headphones",
            price: 12999,
            quantity: 1,
            images: ["/images/headphones.jpg"]
          },
          {
            productId: "102",
            name: "Smartphone Case",
            price: 2499,
            quantity: 2,
            images: ["/images/case.jpg"]
          }
        ],
        subtotal: 17997,
        tax: 1440,
        total: 20736,
        status: "delivered",
        statusUpdatedAt: new Date("2024-01-20"),
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-20")
      },
      {
        _id: generateObjectId(),
        email: email,
        firstName: "John",
        lastName: "Doe",
        address: "123 Main Street",
        city: "Dhaka",
        zipCode: "1212",
        phone: "+880 1XXX-XXXXXX",
        shippingMethod: "standard",
        shippingCost: 59,
        paymentMethod: "paypal",
        items: [
          {
            productId: "103",
            name: "Laptop Backpack",
            price: 5999,
            quantity: 1,
            images: ["/images/backpack.jpg"]
          }
        ],
        subtotal: 5999,
        tax: 480,
        total: 7078,
        status: "shipped",
        statusUpdatedAt: new Date("2024-01-18"),
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-18")
      }
    ];
  };

  // Format Order ID to match server component (last 8 characters uppercase)
  const formatOrderId = (orderId: string) => {
    return orderId.slice(-8).toUpperCase();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-BD').format(price);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const updateResponse = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
        }),
      });

      const result = await updateResponse.json();

      if (!updateResponse.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      if (formData.name !== session?.user?.name) {
        await update({
          ...session,
          user: {
            ...session?.user,
            name: formData.name,
          },
        });
      }

      // Reload profile data to get latest from server
      await loadProfile();
      
      setIsEditing(false);
      setSaveMessage({ type: 'success', message: 'Profile updated successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
      
    } catch (error) {
      console.error("Failed to save profile:", error);
      setSaveMessage({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to update profile' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      dateOfBirth: profile?.dateOfBirth || "",
      gender: profile?.gender || "",
    });
    setIsEditing(false);
    setSaveMessage(null);
  };

  // Address management functions
  const handleAddAddress = async () => {
    try {
      const response = await fetch('/api/users/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressForm),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add address');
      }

      // Refresh addresses data
      await loadProfile();
      setIsAddingAddress(false);
      resetAddressForm();
      
      setSaveMessage({ type: 'success', message: 'Address added successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error adding address:', error);
      setSaveMessage({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to add address' 
      });
    }
  };

  const handleUpdateAddress = async () => {
    if (!isEditingAddress) return;

    try {
      const response = await fetch('/api/users/address', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addressId: isEditingAddress,
          ...addressForm
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update address');
      }

      // Refresh addresses data
      await loadProfile();
      setIsEditingAddress(null);
      setIsAddingAddress(false);
      resetAddressForm();
      
      setSaveMessage({ type: 'success', message: 'Address updated successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error updating address:', error);
      setSaveMessage({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to update address' 
      });
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const response = await fetch(`/api/users/address?id=${addressId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete address');
      }

      // Refresh addresses data
      await loadProfile();
      setSaveMessage({ type: 'success', message: 'Address deleted successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting address:', error);
      setSaveMessage({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to delete address' 
      });
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      const response = await fetch('/api/users/address', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addressId,
          isDefault: true
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to set default address');
      }

      // Refresh addresses data
      await loadProfile();
      setSaveMessage({ type: 'success', message: 'Default address updated!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error setting default address:', error);
      setSaveMessage({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to set default address' 
      });
    }
  };

  const resetAddressForm = () => {
    setAddressForm({
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Bangladesh',
      label: 'home',
      phone: '',
      isDefault: false
    });
  };

  const editAddress = (address: UserAddress) => {
    setAddressForm({
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      label: address.label,
      phone: address.phone || '',
      isDefault: address.isDefault
    });
    setIsEditingAddress(address._id || null);
    setIsAddingAddress(true);
  };

  const showSaveMessage = () => {
    if (!saveMessage) return null;
    
    return (
      <div className={`p-4 rounded-xl mb-6 ${
        saveMessage.type === 'success' 
          ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
          : 'bg-red-50 border border-red-200 text-red-700'
      }`}>
        <div className="flex items-center">
          {saveMessage.type === 'success' ? (
            <FiCheckCircle className="mr-2 text-emerald-500" size={20} />
          ) : (
            <FiX className="mr-2 text-red-500" size={20} />
          )}
          <span className="font-medium">{saveMessage.message}</span>
        </div>
      </div>
    );
  };

  const getStatusColor = (status: IOrder['status']) => {
    switch (status) {
      case "delivered": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "shipped": return "bg-blue-50 text-blue-700 border-blue-200";
      case "processing": return "bg-amber-50 text-amber-700 border-amber-200";
      case "confirmed": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "pending": return "bg-gray-50 text-gray-700 border-gray-200";
      case "cancelled": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: IOrder['status']) => {
    switch (status) {
      case "delivered": return <FiCheckCircle className="text-emerald-500" />;
      case "shipped": return <FiTruck className="text-blue-500" />;
      case "processing": return <FiPackage className="text-amber-500" />;
      case "confirmed": return <FiCheckCircle className="text-indigo-500" />;
      case "pending": return <FiClock className="text-gray-500" />;
      case "cancelled": return <FiX className="text-red-500" />;
      default: return <FiClock className="text-gray-500" />;
    }
  };

  const getStatusLabel = (status: IOrder['status']) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'processing': return 'Processing';
      case 'shipped': return 'Shipped';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getPaymentMethodIcon = (method: IOrder['paymentMethod']) => {
    switch (method) {
      case "card": return <FiCreditCard className="text-gray-600" />;
      case "paypal": return <TakaSign className="text-blue-600" />;
      case "applepay": return <FiBox className="text-gray-800" />;
      case "cod": return <TakaSign className="text-emerald-600" />;
      default: return <FiCreditCard className="text-gray-600" />;
    }
  };

  const getShippingMethodText = (method: IOrder['shippingMethod']) => {
    switch (method) {
      case "standard": return "Standard Shipping";
      case "express": return "Express Shipping";
      case "priority": return "Priority Shipping";
      default: return method;
    }
  };

  // Address Form Component
  const AddressForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">
            {isEditingAddress ? 'Edit Address' : 'Add New Address'}
          </h3>
          <button 
            onClick={() => {
              setIsAddingAddress(false);
              setIsEditingAddress(null);
              resetAddressForm();
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX size={20} className="text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Label</label>
            <select
              value={addressForm.label}
              onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="home">Home</option>
              <option value="work">Work</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
            <input
              type="text"
              value={addressForm.street}
              onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter street address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <input
                type="text"
                value={addressForm.state}
                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="State"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
              <input
                type="text"
                value={addressForm.zipCode}
                onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="ZIP Code"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <input
                type="text"
                value={addressForm.country}
                onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Country"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone (Optional)</label>
            <input
              type="tel"
              value={addressForm.phone}
              onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Phone number for this address"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              checked={addressForm.isDefault}
              onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
              Set as default address
            </label>
          </div>
        </div>

        <div className="p-6 border-t flex space-x-3">
          <button
            onClick={() => {
              setIsAddingAddress(false);
              setIsEditingAddress(null);
              resetAddressForm();
            }}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={isEditingAddress ? handleUpdateAddress : handleAddAddress}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {isEditingAddress ? 'Update Address' : 'Add Address'}
          </button>
        </div>
      </div>
    </div>
  );

  const OrderDetailsModal = ({ order, onClose }: { order: IOrder; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
            <p className="text-gray-600">Order #{formatOrderId(order._id)}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX size={24} className="text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Order Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FiMapPin className="mr-2 text-indigo-500" />
                Shipping Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{order.firstName} {order.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Address:</span>
                  <span className="font-medium text-right">
                    {order.address}{order.apartment && `, ${order.apartment}`}<br />
                    {order.city}, {order.zipCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{order.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{order.email}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FiShoppingBag className="mr-2 text-indigo-500" />
                Order Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)} border`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping Method:</span>
                  <span className="font-medium">{getShippingMethodText(order.shippingMethod)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Method:</span>
                  <div className="flex items-center space-x-2">
                    {getPaymentMethodIcon(order.paymentMethod)}
                    <span className="font-medium capitalize">{order.paymentMethod}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiPackage className="mr-2 text-indigo-500" />
              Order Items ({order.items.length})
            </h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                      {item.images && item.images.length > 0 ? (
                        <Image 
                          src={item.images[0]} 
                          alt={item.name}
                          width={64}
                          height={64}
                          className="rounded-lg object-cover"
                        />
                      ) : (
                        <FiPackage className="text-gray-400" size={24} />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      <TakaSign />{formatPrice(item.price * item.quantity)}
                    </p>
                    <p className="text-sm text-gray-600"><TakaSign />{formatPrice(item.price)} each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Total */}
          <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
            <div className="max-w-sm ml-auto space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span><TakaSign />{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping:</span>
                <span><TakaSign />{formatPrice(order.shippingCost)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax:</span>
                <span><TakaSign />{formatPrice(order.tax)}</span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total:</span>
                  <span><TakaSign />{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">My Account</h1>
              <p className="text-indigo-100 opacity-90">Manage your orders, profile, and preferences</p>
            </div>
            <div className="flex items-center space-x-4 mt-4 lg:mt-0">
              <button
                onClick={refreshData}
                disabled={isRefreshing}
                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                title="Refresh data"
              >
                <FiRefreshCw className={isRefreshing ? 'animate-spin' : ''} size={20} />
              </button>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="font-bold text-lg">
                  {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="font-semibold">{session.user?.name}</p>
                <p className="text-indigo-100 text-sm opacity-80">{session.user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Enhanced Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-8">
              <div className="text-center mb-6 pb-6 border-b border-gray-100">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4 shadow-lg">
                  {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h3 className="font-bold text-gray-900 text-lg">{session.user?.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{session.user?.email}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                  Verified Customer
                </span>
              </div>

              <nav className="space-y-1">
                {[
                  { id: "orders", label: "My Orders", icon: FiShoppingBag, count: orders.length },
                  { id: "profile", label: "Profile Information", icon: FiUser },
                  { id: "address", label: "Address Book", icon: FiMapPin, count: addresses.length },
                  { id: "wishlist", label: "Wishlist", icon: FiHeart, count: wishlist.length },
                  { id: "security", label: "Security", icon: FiShield },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center justify-between w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeTab === item.id
                        ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-100 shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon className={`mr-3 ${activeTab === item.id ? 'text-indigo-500' : 'text-gray-400'}`} size={18} />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {item.count !== undefined && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        activeTab === item.id 
                          ? 'bg-indigo-100 text-indigo-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Enhanced Main Content */}
          <div className="lg:col-span-3">
            {/* Enhanced Orders Tab */}
            {activeTab === "orders" && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="text-xl font-bold text-gray-900">My Orders</h2>
                  <p className="text-gray-600 mt-1">Track and manage your orders</p>
                </div>

                <div className="p-6">
                  {showSaveMessage()}
                  
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiShoppingBag className="text-gray-400" size={40} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                      <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
                      <button
                        onClick={() => router.push("/products")}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Start Shopping
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order._id} className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200 bg-white">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  Order #{formatOrderId(order._id)}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                                  {getStatusLabel(order.status)}
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm">
                                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="mt-4 lg:mt-0 lg:text-right">
                              <p className="text-lg font-bold text-gray-900">
                                <TakaSign />{formatPrice(order.total)}
                              </p>
                              <p className="text-sm text-gray-600">{order.items.length} item(s)</p>
                            </div>
                          </div>

                          {/* Order Items Preview */}
                          <div className="border-t border-gray-100 pt-4 mt-4">
                            <div className="flex items-center space-x-3 overflow-x-auto pb-2">
                              {order.items.slice(0, 3).map((item, index) => (
                                <div key={index} className="flex-shrink-0">
                                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                    {item.images && item.images[0] ? (
                                      <img
                                        src={item.images[0]}
                                        alt={item.name}
                                        className="w-full h-full object-cover rounded-lg"
                                      />
                                    ) : (
                                      <span className="text-gray-400 text-xs text-center">No image</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {order.items.length > 3 && (
                                <div className="flex-shrink-0">
                                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <span className="text-gray-600 text-sm">+{order.items.length - 3}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="border-t border-gray-100 pt-4 mt-4 flex flex-col sm:flex-row gap-3">
                            <button 
                              onClick={() => setSelectedOrder(order)}
                              className="flex-1 bg-indigo-600 text-white text-center py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                            >
                              View Order Details
                            </button>
                            {order.status === 'delivered' && (
                              <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                                Reorder
                              </button>
                            )}
                            {order.status === 'shipped' && (
                              <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                                Track Package
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Enhanced Profile Information Tab */}
            {activeTab === "profile" && profile && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
                    <p className="text-gray-600 mt-1">Manage your personal details</p>
                  </div>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors shadow-lg hover:shadow-xl"
                    >
                      <FiEdit size={16} />
                      <span>Edit Profile</span>
                    </button>
                  ) : (
                    <div className="flex space-x-3">
                      <button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <FiX size={16} />
                        <span>Cancel</span>
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 rounded-xl transition-colors shadow-lg hover:shadow-xl disabled:opacity-50"
                      >
                        <FiSave size={16} />
                        <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {showSaveMessage()}
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <FiUser className="mr-2 text-indigo-500" size={18} />
                        Full Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          placeholder="Enter your full name"
                          disabled={isSaving}
                        />
                      ) : (
                        <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                          <p className="text-gray-900 font-medium">{profile.name}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <FiMail className="mr-2 text-indigo-500" size={18} />
                        Email Address
                      </label>
                      <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-gray-900 font-medium">{profile.email}</p>
                        <p className="text-green-600 text-xs mt-1 flex items-center">
                          <FiCheckCircle className="mr-1" size={12} />
                          Email verified
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <FiPhone className="mr-2 text-indigo-500" size={18} />
                        Phone Number
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          placeholder="Enter your phone number"
                          disabled={isSaving}
                        />
                      ) : (
                        <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                          <p className="text-gray-900 font-medium">
                            {profile.phone || "Not provided"}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <FiCalendar className="mr-2 text-indigo-500" size={18} />
                        Date of Birth
                      </label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          disabled={isSaving}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      ) : (
                        <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                          <p className="text-gray-900 font-medium">
                            {profile.dateOfBirth ? 
                              new Date(profile.dateOfBirth).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              }) : 
                              "Not provided"
                            }
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <FiUser className="mr-2 text-indigo-500" size={18} />
                        Gender
                      </label>
                      {isEditing ? (
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          disabled={isSaving}
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      ) : (
                        <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                          <p className="text-gray-900 font-medium capitalize">
                            {profile.gender || "Not specified"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Address Book Tab */}
            {activeTab === "address" && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Address Book</h2>
                    <p className="text-gray-600 mt-1">Manage your shipping addresses</p>
                  </div>
                  <button
                    onClick={() => setIsAddingAddress(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors shadow-lg hover:shadow-xl"
                  >
                    <FiPlus size={16} />
                    <span>Add New Address</span>
                  </button>
                </div>

                <div className="p-6">
                  {showSaveMessage()}
                  
                  {addresses.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiMapPin className="text-gray-400" size={40} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No addresses saved</h3>
                      <p className="text-gray-600 mb-6">Add your first address to get started</p>
                      <button
                        onClick={() => setIsAddingAddress(true)}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Add Your First Address
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {addresses.map((address) => (
                        <div key={address._id} className={`border rounded-xl p-5 relative ${
                          address.isDefault ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'
                        }`}>
                          {address.isDefault && (
                            <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
                              Default
                            </span>
                          )}
                          
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                address.label === 'home' ? 'bg-blue-100 text-blue-800' :
                                address.label === 'work' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {address.label.charAt(0).toUpperCase() + address.label.slice(1)}
                              </span>
                              <h3 className="font-semibold text-gray-900 mt-2">
                                {address.street}
                              </h3>
                            </div>
                          </div>

                          <div className="space-y-1 text-sm text-gray-600">
                            <p>{address.city}, {address.state}</p>
                            <p>{address.zipCode}, {address.country}</p>
                            {address.phone && <p>Phone: {address.phone}</p>}
                          </div>

                          <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                            {!address.isDefault && (
                              <button
                                onClick={() => handleSetDefaultAddress(address._id!)}
                                className="flex-1 text-xs bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                Set Default
                              </button>
                            )}
                            <button
                              onClick={() => editAddress(address)}
                              className="flex-1 text-xs bg-blue-100 text-blue-700 py-2 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address._id!)}
                              className="flex-1 text-xs bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Enhanced Wishlist Tab */}
            {activeTab === "wishlist" && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="text-xl font-bold text-gray-900">My Wishlist</h2>
                  <p className="text-gray-600 mt-1">
                    {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
                  </p>
                </div>
                
                <div className="p-6">
                  {showSaveMessage()}
                  
                  {isWishlistLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Loading your wishlist...</p>
                    </div>
                  ) : wishlist.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiHeart className="text-gray-400" size={40} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
                      <p className="text-gray-600 mb-6">Start saving your favorite items</p>
                      <button
                        onClick={() => router.push("/products")}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Browse Products
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {wishlist.map((item) => (
                        <div key={item.productId} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 group">
                          {/* Product Image */}
                          <div className="relative h-48 bg-gray-100 overflow-hidden">
                            {item.productDetails?.images?.[0] ? (
                              <Image
                                src={item.productDetails.images[0]}
                                alt={item.productDetails.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FiPackage className="text-gray-400" size={48} />
                              </div>
                            )}
                            
                            {/* Remove from wishlist button */}
                            <button
                              onClick={() => removeFromWishlist(item.productId)}
                              className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Remove from wishlist"
                            >
                              <FiTrash2 size={16} />
                            </button>
                            
                            {/* Added date */}
                            <div className="absolute top-3 left-3">
                              <span className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                                Added {new Date(item.addedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          {/* Product Info */}
                          <div className="p-4">
                            <div className="mb-2">
                              <span className="text-xs text-gray-500 uppercase tracking-wide">
                                {item.productDetails?.category || 'Product'}
                              </span>
                            </div>
                            
                            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2" style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {item.productDetails?.name || 'Product Name'}
                            </h3>
                            
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-lg font-bold text-gray-900">
                                <TakaSign />{formatPrice(item.productDetails?.price || 0)}
                              </span>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex space-x-2">
                              <button
                                onClick={() => item.productDetails && addToCartFromWishlist(item.productDetails)}
                                className="flex-1 bg-indigo-600 text-white py-2 px-3 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center justify-center"
                                disabled={!item.productDetails}
                              >
                                <FiShoppingBag className="mr-2" size={14} />
                                Add to Cart
                              </button>
                              
                              <button
                                onClick={() => item.productDetails && router.push(`/products/${item.productDetails.slug}`)}
                                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                disabled={!item.productDetails}
                              >
                                View
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="text-xl font-bold text-gray-900">Security Settings</h2>
                  <p className="text-gray-600 mt-1">Manage your account security</p>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                      <div>
                        <h3 className="font-semibold text-gray-900">Change Password</h3>
                        <p className="text-gray-600 text-sm">Update your account password</p>
                      </div>
                      <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        Change
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                      <div>
                        <h3 className="font-semibold text-gray-900">Two-Factor Authentication</h3>
                        <p className="text-gray-600 text-sm">Add an extra layer of security</p>
                      </div>
                      <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        Enable
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}

      {/* Address Form Modal */}
      {isAddingAddress && <AddressForm />}
    </div>
  );
};

export default AccountPage;