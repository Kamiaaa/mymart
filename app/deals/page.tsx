// app/deals/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  _id: string;
  productId: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  images: string[];
  rating: number;
  reviews: number;
  inStock: boolean;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

export default function TodaysDealsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  });

  // Filter states for deals page
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [discountRange, setDiscountRange] = useState<[number, number]>([10, 90]);
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<string>('discount-high');

  // Format currency function
  const formatCurrency = (amount: number) => {
    return (
      <span className="flex items-baseline">
        <span className="text-2xl font-extrabold mr-0.5">৳</span>
        <span>{amount.toFixed(2)}</span>
      </span>
    );
  };

  // Calculate discount percentage
  const calculateDiscount = (price: number, originalPrice?: number) => {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round((1 - price / originalPrice) * 100);
  };

  // Countdown timer for deals
  // Countdown timer for deals - optimized version
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const difference = endOfDay.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Get products with discounts only
  const productsWithDiscounts = products.filter(product =>
    product.originalPrice && product.originalPrice > product.price
  );

  // Get unique categories for filter
  const categories = ['all', ...new Set(productsWithDiscounts.map(product => product.category))];

  // Filter and sort deals
  const filteredDeals = productsWithDiscounts
    .filter(product => {
      const discount = calculateDiscount(product.price, product.originalPrice);

      // Category filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }

      // Discount range filter
      if (discount < discountRange[0] || discount > discountRange[1]) {
        return false;
      }

      // Rating filter
      if (product.rating < minRating) {
        return false;
      }

      // Stock filter
      if (inStockOnly && !product.inStock) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const discountA = calculateDiscount(a.price, a.originalPrice);
      const discountB = calculateDiscount(b.price, b.originalPrice);

      switch (sortBy) {
        case 'discount-high':
          return discountB - discountA;
        case 'discount-low':
          return discountA - discountB;
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return discountB - discountA;
      }
    });

  // Reset all filters
  const resetFilters = () => {
    setSelectedCategory('all');
    setDiscountRange([10, 90]);
    setMinRating(0);
    setInStockOnly(true);
    setSortBy('discount-high');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-red-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-600"></div>
            <p className="mt-3 text-gray-600 font-medium">Loading today's deals...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-red-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">Error loading deals</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <div className="mt-4">
                  <button
                    onClick={fetchProducts}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-red-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Today's <span className="text-red-600">Hot Deals</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Don't miss out on these amazing discounts! Limited time offers ending soon.
          </p>

          {/* Countdown Timer */}
          <div className="bg-white rounded-xl shadow-sm p-6 max-w-md mx-auto mb-6">
            <div className="text-sm font-semibold text-gray-600 mb-3">Deals end in:</div>
            <div className="flex justify-center space-x-4">
              <div className="text-center">
                <div className="bg-red-100 text-red-800 rounded-lg py-2 px-3 text-2xl font-bold">
                  {timeLeft.hours.toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-500 mt-1">Hours</div>
              </div>
              <div className="text-center">
                <div className="bg-red-100 text-red-800 rounded-lg py-2 px-3 text-2xl font-bold">
                  {timeLeft.minutes.toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-500 mt-1">Minutes</div>
              </div>
              <div className="text-center">
                <div className="bg-red-100 text-red-800 rounded-lg py-2 px-3 text-2xl font-bold">
                  {timeLeft.seconds.toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-500 mt-1">Seconds</div>
              </div>
            </div>
          </div>
        </div>

        {productsWithDiscounts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-2xl mx-auto">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-medium text-gray-900">No deals available today</h2>
            <p className="mt-2 text-gray-500">Check back later for amazing discounts!</p>
            <Link
              href="/products"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            >
              View All Products
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filters Sidebar */}
            <div className="lg:w-80 bg-white rounded-xl shadow-sm p-6 h-fit">
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Filter Deals</h2>
                <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-1 rounded-full">
                  {filteredDeals.length} deals
                </span>
              </div>

              <div className="space-y-6">
                {/* Category filter */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Category</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {categories.map(category => (
                      <div key={category} className="flex items-center">
                        <input
                          id={`deal-category-${category}`}
                          type="radio"
                          name="deal-category"
                          checked={selectedCategory === category}
                          onChange={() => setSelectedCategory(category)}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                        />
                        <label htmlFor={`deal-category-${category}`} className="ml-2 text-sm text-gray-700 capitalize">
                          {category} ({category === 'all' ? productsWithDiscounts.length : productsWithDiscounts.filter(p => p.category === category).length})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Discount range filter */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                    Discount: {discountRange[0]}% - {discountRange[1]}%
                  </h3>
                  <div className="px-1">
                    <input
                      type="range"
                      min="10"
                      max="90"
                      step="5"
                      value={discountRange[1]}
                      onChange={(e) => setDiscountRange([discountRange[0], parseInt(e.target.value)])}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg accent-red-600"
                    />
                    <div className="flex justify-between mt-3">
                      <span className="text-sm text-gray-600 font-medium">{discountRange[0]}%</span>
                      <span className="text-sm text-gray-600 font-medium">{discountRange[1]}%</span>
                    </div>
                  </div>
                </div>

                {/* Rating filter */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Minimum Rating</h3>
                  <div className="flex items-center space-x-2">
                    {[0, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setMinRating(rating)}
                        className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-200 ${minRating === rating
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {rating === 0 ? '★' : rating}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stock filter */}
                <div className="flex items-center p-2 bg-gray-50 rounded-lg">
                  <input
                    id="deal-in-stock-only"
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={() => setInStockOnly(!inStockOnly)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="deal-in-stock-only" className="ml-2 text-sm text-gray-700 font-medium">
                    In Stock Only
                  </label>
                </div>

                {/* Sort by */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Sort By</h3>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-lg bg-white border shadow-sm"
                  >
                    <option value="discount-high">Highest Discount</option>
                    <option value="discount-low">Lowest Discount</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                    <option value="newest">Newest Deals</option>
                  </select>
                </div>

                {/* Reset filters */}
                <button
                  onClick={resetFilters}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Reset Filters
                </button>
              </div>
            </div>

            {/* Deals Grid */}
            <div className="flex-1">
              {/* Results info */}
              <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-gray-600">
                      Showing <span className="font-semibold text-red-700">{filteredDeals.length}</span> of {productsWithDiscounts.length} deals
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Save up to {Math.max(...productsWithDiscounts.map(p => calculateDiscount(p.price, p.originalPrice)))}% today!
                  </div>
                </div>
              </div>

              {/* Deals grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredDeals.map(product => {
                  const discount = calculateDiscount(product.price, product.originalPrice);

                  return (
                    <div key={product._id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 group border-2 border-transparent hover:border-red-200">
                      {/* Discount Badge */}
                      <div className="absolute top-3 left-3 z-10">
                        <span className="bg-red-600 text-white text-sm font-bold px-3 py-2 rounded-full shadow-lg">
                          {discount}% OFF
                        </span>
                      </div>

                      <div className="relative">
                        <div className="w-full h-52 relative flex justify-center bg-gray-100 overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              height={300}
                              width={300}
                              className='w-auto h-52 object-cover group-hover:scale-110 transition-transform duration-300'
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {!product.inStock && (
                          <div className="absolute top-3 right-3 bg-gray-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-sm">
                            Out of Stock
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full capitalize">
                            {product.category}
                          </span>
                        </div>

                        <div className="flex items-center mb-3">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map(star => (
                              <svg
                                key={star}
                                className={`h-4 w-4 ${star <= Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            ({product.reviews} reviews)
                          </span>
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>

                        {/* Price Section */}
                        <div className="mb-4">
                          <div className="flex items-center">
                            <span className="text-2xl font-bold text-gray-900">{formatCurrency(product.price)}</span>
                            {product.originalPrice && (
                              <span className="ml-3 text-lg text-gray-500 line-through">
                                {formatCurrency(product.originalPrice)}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-green-600 font-medium mt-1">
                            You save {formatCurrency(product.originalPrice! - product.price)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                          <Link
                            href={`/products/${product._id}`}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg text-sm shadow-sm transition-colors duration-200 text-center"
                          >
                            View Deal
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredDeals.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-2xl mx-auto mt-6">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="mt-4 text-xl font-medium text-gray-900">No deals match your filters</h2>
                  <p className="mt-2 text-gray-500">Try adjusting your filters to find more deals.</p>
                  <button
                    onClick={resetFilters}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}