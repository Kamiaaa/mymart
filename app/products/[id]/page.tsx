// app/products/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/app/context/CartContext';
import { useWishlist } from '@/app/context/WishlistContext';
import { FiHeart, FiShare2, FiArrowLeft } from 'react-icons/fi';

interface Product {
  _id: string;
  productId: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  images: string[];
  rating: number;
  reviews: number;
  inStock: boolean;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

// Image Gallery Component
function ProductImageGallery({ product }: { product: Product }) {
  const productImages: string[] = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : typeof product.images === "string" && product.images
      ? [product.images]
      : product.image
        ? [product.image]
        : ["/placeholder.png"];

  const [selectedImage, setSelectedImage] = useState<string>(productImages[0]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      {/* Thumbnails */}
      {productImages.length > 1 ? (
        <div className="flex md:flex-col gap-3 order-2 md:order-1">
          {productImages.map((img, index) => (
            <div
              key={index}
              onClick={() => setSelectedImage(img)}
              className={`border-2 rounded-lg p-1.5 cursor-pointer transition-all duration-200 ${selectedImage === img ? "border-indigo-500 shadow-sm" : "border-gray-200 hover:border-gray-300"
                }`}
            >
              <Image
                src={img}
                alt={`${product.name} thumbnail ${index + 1}`}
                width={100}
                height={100}
                className="object-contain rounded-md"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="order-2 md:order-1 flex items-center justify-center text-gray-500 text-sm">
          No additional images
        </div>
      )}

      {/* Main Image */}
      <div className="col-span-2 md:col-span-2 lg:col-span-3 flex items-center justify-center order-1 md:order-2 bg-gray-50 rounded-xl p-6">
        <Image
          src={selectedImage}
          alt={product.name}
          width={600}
          height={600}
          className="object-contain rounded-lg shadow-sm transition-opacity duration-300"
        />
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { 
    addToWishlist, 
    removeFromWishlist, 
    isInWishlist, 
    wishlistItems 
  } = useWishlist();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showCartNotification, setShowCartNotification] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showWishlistNotification, setShowWishlistNotification] = useState(false);
  const [wishlistAction, setWishlistAction] = useState<'added' | 'removed'>('added');
  const [sharingProduct, setSharingProduct] = useState(false);

  // Fixed format currency function with null/undefined check
  const formatCurrency = (amount: number | undefined | null) => {
    const safeAmount = amount === undefined || amount === null ? 0 : amount;
    return (
      <span className="flex items-baseline">
        <span className="text-2xl font-extrabold mr-0.5">৳</span>
        <span>{safeAmount.toFixed(2)}</span>
      </span>
    );
  };

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string);
    }
  }, [params.id]);

  useEffect(() => {
    if (product) {
      setIsWishlisted(isInWishlist(product._id));
    }
  }, [product, wishlistItems, isInWishlist]);

  const fetchProduct = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/products/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found');
        }
        throw new Error(`Failed to fetch product: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validate and sanitize the data
      const sanitizedProduct: Product = {
        _id: data._id || id,
        productId: data.productId || `PID-${id}`,
        name: data.name || 'Unnamed Product',
        description: data.description || 'No description available',
        price: typeof data.price === 'number' ? data.price : 0,
        originalPrice: typeof data.originalPrice === 'number' ? data.originalPrice : undefined,
        category: data.category?.name || data.category || 'Uncategorized',
        image: data.image || data.images?.[0] || '/placeholder.png',
        images: Array.isArray(data.images) ? data.images : 
               (data.image ? [data.image] : ['/placeholder.png']),
        rating: typeof data.rating === 'number' ? Math.min(Math.max(data.rating, 0), 5) : 0,
        reviews: typeof data.reviews === 'number' ? Math.max(data.reviews, 0) : 0,
        inStock: data.inStock !== undefined ? data.inStock : true,
        features: Array.isArray(data.features) ? data.features : [],
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString()
      };
      
      setProduct(sanitizedProduct);
    } catch (err) {
      console.error('Error fetching product:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while loading the product');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    setAddingToCart(true);
    
    const cartItem = {
      _id: product._id,
      productId: product.productId,
      name: product.name,
      price: product.price,
      quantity: quantity,
      images: product.images,
      inStock: product.inStock
    };
    
    addToCart(cartItem);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    setAddingToCart(false);
    
    setShowCartNotification(true);
    setTimeout(() => setShowCartNotification(false), 3000);
  };

  const handleBuyNow = () => {
    if (!product) return;
    
    const cartItem = {
      _id: product._id,
      productId: product.productId,
      name: product.name,
      price: product.price,
      quantity: quantity,
      images: product.images,
      inStock: product.inStock
    };
    
    addToCart(cartItem);
    router.push("/cart");
  };

  const handleWishlistToggle = async () => {
    if (!product) return;

    if (isWishlisted) {
      await removeFromWishlist(product._id);
      setIsWishlisted(false);
      setWishlistAction('removed');
    } else {
      await addToWishlist(product);
      setIsWishlisted(true);
      setWishlistAction('added');
    }
    
    setShowWishlistNotification(true);
    setTimeout(() => setShowWishlistNotification(false), 3000);
  };

  const handleShareProduct = async () => {
    if (!product) return;

    setSharingProduct(true);
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(window.location.href);
        setWishlistAction('added'); // Reuse for share notification
        setShowWishlistNotification(true);
        setTimeout(() => setShowWishlistNotification(false), 2000);
      }
    } catch (error) {
      console.error('Error sharing product:', error);
    } finally {
      setSharingProduct(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
            <p className="mt-3 text-gray-600 font-medium">Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">Error loading product</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <div className="mt-4 flex space-x-3">
                  <button 
                    onClick={() => router.back()}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                  >
                    <FiArrowLeft className="mr-2" />
                    Go Back
                  </button>
                  <Link
                    href="/products"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                  >
                    View All Products
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-yellow-800">Product not found</h3>
                <p className="mt-1 text-sm text-yellow-700">The product you're looking for doesn't exist or may have been removed.</p>
                <div className="mt-4">
                  <Link
                    href="/products"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                  >
                    Browse Products
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8">
      {/* Notifications */}
      {showCartNotification && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center">
            <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Added to cart successfully!</span>
            <button 
              onClick={() => setShowCartNotification(false)}
              className="ml-4 text-green-700 hover:text-green-900"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {showWishlistNotification && (
        <div className="fixed top-4 left-4 z-50 animate-fade-in-down">
          <div className={`border px-4 py-3 rounded-lg shadow-lg flex items-center ${
            wishlistAction === 'added' 
              ? 'bg-blue-100 border-blue-400 text-blue-700' 
              : 'bg-gray-100 border-gray-400 text-gray-700'
          }`}>
            <FiHeart className={`h-6 w-6 mr-2 ${wishlistAction === 'added' ? 'fill-blue-700' : ''}`} />
            <span>
              {wishlistAction === 'added' ? 'Added to wishlist!' : 'Removed from wishlist!'}
            </span>
            <button 
              onClick={() => setShowWishlistNotification(false)}
              className="ml-4"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link href="/" className="text-gray-500 hover:text-indigo-600 transition-colors duration-200">
                Home
              </Link>
            </li>
            <li>
              <svg className="flex-shrink-0 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
              </svg>
            </li>
            <li>
              <Link href="/products" className="text-gray-500 hover:text-indigo-600 transition-colors duration-200">
                Products
              </Link>
            </li>
            <li>
              <svg className="flex-shrink-0 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
              </svg>
            </li>
            <li>
              <span className="text-indigo-600 font-medium">{product.name}</span>
            </li>
          </ol>
        </nav>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            {/* Product Images */}
            <div>
              <ProductImageGallery product={product} />
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                
                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map(star => (
                      <svg
                        key={star}
                        className={`h-5 w-5 ${star <= Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">
                    ({product.reviews} review{product.reviews !== 1 ? 's' : ''})
                  </span>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full capitalize">
                    {product.category}
                  </span>
                </div>

                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>

              {product.features && product.features.length > 0 && (
                <div className="bg-gray-50 p-5 rounded-lg">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Key Features</h2>
                  <ul className="space-y-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-gray-900">{formatCurrency(product.price)}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="ml-3 text-lg text-gray-500 line-through">
                      {formatCurrency(product.originalPrice)}
                    </span>
                    <span className="ml-3 bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                      Save {Math.round((1 - product.price / product.originalPrice) * 100)}%
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  product.inStock 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {product.inStock ? (
                    <>
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      In Stock
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Out of Stock
                    </>
                  )}
                </span>
              </div>

              {/* Wishlist and Share Buttons */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleWishlistToggle}
                  className={`flex items-center px-4 py-3 rounded-lg border transition-all duration-200 ${
                    isWishlisted
                      ? 'bg-red-50 border-red-200 text-red-600 shadow-sm'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                  }`}
                >
                  <FiHeart className={`h-5 w-5 mr-2 ${isWishlisted ? 'fill-red-600' : ''}`} />
                  {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                </button>

                <button
                  onClick={handleShareProduct}
                  disabled={sharingProduct}
                  className="flex items-center px-4 py-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 disabled:opacity-50"
                >
                  <FiShare2 className="h-5 w-5 mr-2" />
                  {sharingProduct ? 'Sharing...' : 'Share'}
                </button>
              </div>

              {product.inStock && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-4 py-3 text-gray-600 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                        disabled={quantity <= 1}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-14 text-center border-0 bg-transparent py-3 font-medium"
                      />
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-4 py-3 text-gray-600 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <button
                        onClick={handleAddToCart}
                        disabled={addingToCart}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg shadow-sm transition-colors duration-200 flex items-center justify-center disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        {addingToCart ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Adding...
                          </>
                        ) : (
                          <>
                            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Add to Cart
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleBuyNow}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg shadow-sm transition-colors duration-200 flex items-center justify-center"
                      >
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4 mt-6">
                <div className="text-sm text-gray-500 flex items-center">
                  <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Product ID: {product.productId}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section (Optional) */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">You might also like</h2>
            <Link 
              href="/products" 
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              View all products →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Placeholder for related products - you can implement this later */}
            <div className="text-center py-8 text-gray-500">
              <FiHeart className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>More products coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}