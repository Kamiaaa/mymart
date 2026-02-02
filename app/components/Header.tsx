// app/components/Header.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  FiSearch,
  FiHeart,
  FiShoppingCart,
  FiUser,
  FiChevronDown,
  FiMenu,
  FiX,
  FiChevronRight,
  FiLogOut,
  FiSettings,
  FiShoppingBag,
  FiList,
  FiHome,
  FiTag,
  FiHelpCircle,
} from "react-icons/fi";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useSession, signIn, signOut } from "next-auth/react";

interface Category {
  name: string;
}

const Header = () => {
  const { getCartItemsCount } = useCart();
  const { getWishlistItemsCount } = useWishlist();
  const { data: session, status } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProductsExpanded, setIsProductsExpanded] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false);
  
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    };
    fetchCategories();
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
      if (mobileMenuRef.current && 
          !mobileMenuRef.current.contains(event.target as Node) && 
          isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleProductsExpanded = () => setIsProductsExpanded(!isProductsExpanded);
  const toggleAccountMenu = () => setIsAccountMenuOpen(!isAccountMenuOpen);
  const toggleCategoryMenu = () => setIsCategoryMenuOpen(!isCategoryMenuOpen);
  const toggleMobileSearch = () => setIsMobileSearchVisible(!isMobileSearchVisible);

  const handleCategoryClick = (categoryName: string) => {
    router.push(`/category/${categoryName}`);
    setIsMobileMenuOpen(false);
    setIsProductsExpanded(false);
    setIsCategoryMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
    setIsProductsExpanded(false);
    setIsAccountMenuOpen(false);
    setIsCategoryMenuOpen(false);
    setIsMobileSearchVisible(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsSearchFocused(false);
      setIsMobileSearchVisible(false);
    }
  };

  const handleQuickSearch = (item: string) => {
    setSearchQuery(item);
    router.push(`/search?q=${encodeURIComponent(item)}`);
    setIsSearchFocused(false);
    setIsMobileSearchVisible(false);
  };

  const handleLogout = () => {
    signOut();
    setIsAccountMenuOpen(false);
  };

  const quickSearches = ["Smartphones", "Laptops", "Headphones", "Cameras", "Smart Watches"];

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-100">
      {/* Top Bar */}
      <div className="bg-orange-600 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto text-center text-sm">
          <p className="truncate">🎉 Free shipping on orders over ৳3000! | <strong>Daily Deals</strong> - Up to 50% off</p>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          {/* Logo + Mobile Menu */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            <button
              className="lg:hidden text-gray-700 hover:text-orange-600 transition-colors p-1"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
            
            <div
              className="cursor-pointer flex items-center"
              onClick={() => handleNavigation("/")}
            >
              <div className="relative">
                <Image
                  src="/img/logo.png"
                  alt="Daily Mart Logo"
                  height={300}
                  width={300}
                  className="h-auto w-40"
                />
              </div>
            </div>

            {/* Desktop Categories Menu */}
            <div className="hidden lg:block relative" ref={categoryMenuRef}>
              <button
                onClick={toggleCategoryMenu}
                className="flex items-center space-x-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm sm:text-base"
                aria-label="Browse categories"
              >
                <FiMenu size={18} />
                <span className="font-medium">All Categories</span>
                <FiChevronDown size={16} />
              </button>

              {isCategoryMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white shadow-xl rounded-lg border border-gray-200 py-2 z-50">
                  <div className="max-h-96 overflow-y-auto">
                    {categories.map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => handleCategoryClick(cat.name)}
                        className="flex items-center w-full px-4 py-3 text-left text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors border-b border-gray-100 last:border-b-0 text-sm"
                      >
                        <FiTag className="mr-3 text-gray-400" size={16} />
                        <span className="font-medium">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-4 lg:mx-8 relative" ref={searchRef}>
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for products, brands and more..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  className="w-full px-4 py-2 pl-12 pr-20 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-sm"
                />
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-orange-600 text-white px-3 py-1.5 rounded-md hover:bg-orange-700 transition-colors text-sm"
                >
                  Search
                </button>
              </div>

              {/* Search Suggestions */}
              {isSearchFocused && searchQuery && (
                <div className="absolute top-full left-0 right-0 bg-white shadow-lg rounded-lg border border-gray-200 mt-1 z-50">
                  <div className="p-2 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-700">Quick searches</p>
                  </div>
                  {quickSearches.map((item, index) => (
                    <button
                      key={`quick-search-${index}`}
                      onClick={() => handleQuickSearch(item)}
                      className="flex items-center w-full px-3 py-2 text-left text-gray-600 hover:bg-gray-50 text-sm"
                    >
                      <FiSearch className="mr-2 text-gray-400" size={14} />
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </form>
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Search Icon - Mobile */}
            <button 
              className="md:hidden text-gray-700 hover:text-orange-600 transition-colors p-1"
              onClick={toggleMobileSearch}
              aria-label="Search"
            >
              <FiSearch size={20} />
            </button>

            {/* Wishlist Icon - Hide for admin users */}
            {session?.user?.role !== "admin" && (
              <div className="relative">
                <button
                  className="text-gray-700 hover:text-orange-600 transition-colors relative group p-1"
                  onClick={() => handleNavigation("/wishlist")}
                  title="Wishlist"
                  aria-label="Wishlist"
                >
                  <FiHeart size={20} />
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                    {getWishlistItemsCount()}
                  </span>
                  
                  {/* Tooltip */}
                  <div className="absolute top-full right-0 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    My Wishlist
                  </div>
                </button>
              </div>
            )}

            {/* Cart Icon */}
            <div className="relative">
              <button
                className="text-gray-700 hover:text-orange-600 transition-colors relative group p-1"
                onClick={() => handleNavigation("/cart")}
                title="Shopping Cart"
                aria-label="Shopping cart"
              >
                <FiShoppingCart size={20} />
                {getCartItemsCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                    {getCartItemsCount()}
                  </span>
                )}
                
                {/* Tooltip */}
                <div className="absolute top-full right-0 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  My Cart
                </div>
              </button>
            </div>

            {/* Account */}
            <div className="relative" ref={accountMenuRef}>
              {!session ? (
                <button
                  onClick={() => signIn()}
                  className="text-gray-700 hover:text-orange-600 transition-colors flex items-center space-x-1 group p-1"
                  title="Login / Register"
                  aria-label="Account"
                >
                  <FiUser size={20} />
                  <span className="hidden lg:inline font-medium text-sm">Login</span>
                  
                  {/* Tooltip */}
                  <div className="absolute top-full right-0 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    Sign In / Register
                  </div>
                </button>
              ) : (
                <div className="relative">
                  <button
                    onClick={toggleAccountMenu}
                    className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 transition-colors group"
                    aria-label="Account menu"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-orange-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                      {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-medium truncate max-w-[120px]">{session.user?.name}</p>
                      <p className="text-xs text-gray-500">Welcome back!</p>
                    </div>
                    <FiChevronDown className={`transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''} hidden sm:block`} />
                  </button>

                  {/* Account Dropdown Menu */}
                  {isAccountMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white shadow-xl rounded-lg border border-gray-200 py-2 z-50">
                      {/* User Info */}
                      <div className="px-3 py-2 border-b border-gray-100">
                        <p className="font-medium text-gray-900 text-sm truncate">{session.user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                        {session.user?.role && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full capitalize">
                            {session.user.role}
                          </span>
                        )}
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <button
                          onClick={() => handleNavigation("/account")}
                          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <FiUser className="mr-2" size={14} />
                          My Profile
                        </button>

                        {/* Only show Orders and Wishlist for non-admin users */}
                        {session.user?.role !== "admin" && (
                          <>
                            <button
                              onClick={() => handleNavigation("/orders")}
                              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <FiShoppingBag className="mr-2" size={14} />
                              My Orders
                            </button>

                            <button
                              onClick={() => handleNavigation("/wishlist")}
                              className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center">
                                <FiHeart className="mr-2" size={14} />
                                Wishlist
                              </div>
                              <span className="bg-pink-100 text-pink-800 text-xs px-1.5 py-0.5 rounded-full">
                                {getWishlistItemsCount()}
                              </span>
                            </button>
                          </>
                        )}

                        {session.user?.role === "admin" && (
                          <button
                            onClick={() => handleNavigation("/admin")}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100 mt-1"
                          >
                            <FiSettings className="mr-2" size={14} />
                            Admin Dashboard
                          </button>
                        )}
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <FiLogOut className="mr-2" size={14} />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className={`md:hidden mt-3 transition-all duration-300 ${isMobileSearchVisible ? 'block' : 'hidden'}`}>
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <button
              type="submit"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-orange-600 text-white px-3 py-1 rounded-md hover:bg-orange-700 transition-colors text-sm"
            >
              Go
            </button>
          </form>
          
          {/* Quick Search Suggestions for Mobile */}
          {searchQuery && (
            <div className="absolute left-0 right-0 bg-white shadow-lg rounded-lg border border-gray-200 mt-1 z-40">
              <div className="p-2 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-700">Quick searches</p>
              </div>
              {quickSearches.map((item, index) => (
                <button
                  key={`mobile-quick-search-${index}`}
                  onClick={() => handleQuickSearch(item)}
                  className="flex items-center w-full px-3 py-2 text-left text-gray-600 hover:bg-gray-50 text-sm"
                >
                  <FiSearch className="mr-2 text-gray-400" size={14} />
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center justify-center space-x-6 mt-3">
          <button
            onClick={() => handleNavigation("/")}
            className="text-gray-700 hover:text-orange-600 font-medium transition-colors flex items-center space-x-1 text-sm"
          >
            <FiHome size={14} />
            <span>Home</span>
          </button>
          
          <button
            onClick={() => handleNavigation("/products")}
            className="text-gray-700 hover:text-orange-600 font-medium transition-colors text-sm"
          >
            All Products
          </button>
          
          <button
            onClick={() => handleNavigation("/deals")}
            className="text-red-600 hover:text-red-700 font-medium transition-colors flex items-center space-x-1 text-sm"
          >
            <FiTag size={14} />
            <span>Today's Deals</span>
          </button>
          
          <button
            onClick={() => handleNavigation("/new-arrivals")}
            className="text-gray-700 hover:text-orange-600 font-medium transition-colors text-sm"
          >
            New Arrivals
          </button>
          
          <button
            onClick={() => handleNavigation("/support")}
            className="text-gray-700 hover:text-orange-600 font-medium transition-colors flex items-center space-x-1 text-sm"
          >
            <FiHelpCircle size={14} />
            <span>Support</span>
          </button>
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Mobile Menu */}
      <div
        ref={mobileMenuRef}
        className={`fixed top-0 left-0 h-full w-80 max-w-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 lg:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-orange-600 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <FiUser size={16} />
            </div>
            <div className="max-w-[200px]">
              {session ? (
                <>
                  <p className="font-medium text-sm truncate">{session.user?.name}</p>
                  <p className="text-xs text-orange-100 truncate">{session.user?.email}</p>
                </>
              ) : (
                <>
                  <p className="font-medium text-sm">Welcome!</p>
                  <p className="text-xs text-orange-100">Sign in for better experience</p>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-white hover:text-orange-200 transition-colors p-1"
            aria-label="Close menu"
          >
            <FiX size={20} />
          </button>
        </div>

        <nav className="p-4 overflow-y-auto h-full pb-32">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {!session ? (
              <button
                onClick={() => {
                  signIn();
                  setIsMobileMenuOpen(false);
                }}
                className="col-span-2 bg-orange-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-orange-700 transition-colors text-sm"
              >
                Sign In / Register
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleNavigation("/account")}
                  className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                >
                  My Account
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-100 text-red-700 py-2 px-3 rounded-lg font-medium hover:bg-red-200 transition-colors text-sm"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Navigation Links */}
          <ul className="space-y-0">
            <li>
              <button
                onClick={() => handleNavigation("/")}
                className="flex items-center w-full text-left py-2 px-3 rounded-lg text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors text-sm"
              >
                <FiHome className="mr-3" size={16} />
                Home
              </button>
            </li>

            <li>
              <div className="py-0">
                <button
                  onClick={toggleProductsExpanded}
                  className="flex items-center justify-between w-full text-left py-2 px-3 rounded-lg text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors text-sm"
                >
                  <div className="flex items-center">
                    <FiShoppingBag className="mr-3" size={16} />
                    Products
                  </div>
                  {isProductsExpanded ? (
                    <FiChevronDown className="transition-transform" size={16} />
                  ) : (
                    <FiChevronRight className="transition-transform" size={16} />
                  )}
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isProductsExpanded ? "max-h-96" : "max-h-0"
                  }`}
                >
                  <ul className="pl-4 mt-1 space-y-0">
                    <li key="all-products">
                      <button
                        onClick={() => handleNavigation("/products")}
                        className="flex items-center w-full text-left py-2 px-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors text-sm"
                      >
                        All Products
                      </button>
                    </li>
                    {categories.map((cat) => (
                      <li key={cat.name}>
                        <button
                          onClick={() => handleCategoryClick(cat.name)}
                          className="flex items-center w-full text-left py-2 px-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors text-sm"
                        >
                          <FiTag className="mr-2" size={12} />
                          {cat.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>

            <li key="deals">
              <button
                onClick={() => handleNavigation("/deals")}
                className="flex items-center w-full text-left py-2 px-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm"
              >
                <FiTag className="mr-3" size={16} />
                Today's Deals
              </button>
            </li>

            {/* Hide Wishlist for admin users in mobile menu */}
            {session?.user?.role !== "admin" && (
              <li key="wishlist">
                <button
                  onClick={() => handleNavigation("/wishlist")}
                  className="flex items-center justify-between w-full text-left py-2 px-3 rounded-lg text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors text-sm"
                >
                  <div className="flex items-center">
                    <FiHeart className="mr-3" size={16} />
                    My Wishlist
                  </div>
                  <span className="bg-pink-100 text-pink-800 text-xs px-1.5 py-0.5 rounded-full">
                    {getWishlistItemsCount()}
                  </span>
                </button>
              </li>
            )}

            <li key="cart">
              <button
                onClick={() => handleNavigation("/cart")}
                className="flex items-center justify-between w-full text-left py-2 px-3 rounded-lg text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors text-sm"
              >
                <div className="flex items-center">
                  <FiShoppingCart className="mr-3" size={16} />
                  My Cart
                </div>
                {getCartItemsCount() > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs px-1.5 py-0.5 rounded-full">
                    {getCartItemsCount()}
                  </span>
                )}
              </button>
            </li>

            {/* Hide Orders for admin users in mobile menu */}
            {session?.user?.role !== "admin" && (
              <li key="orders">
                <button
                  onClick={() => handleNavigation("/orders")}
                  className="flex items-center w-full text-left py-2 px-3 rounded-lg text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors text-sm"
                >
                  <FiList className="mr-3" size={16} />
                  My Orders
                </button>
              </li>
            )}

            <li key="support">
              <button
                onClick={() => handleNavigation("/support")}
                className="flex items-center w-full text-left py-2 px-3 rounded-lg text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors text-sm"
              >
                <FiHelpCircle className="mr-3" size={16} />
                Customer Support
              </button>
            </li>

            {session?.user?.role === "admin" && (
              <li key="admin">
                <button
                  onClick={() => handleNavigation("/admin")}
                  className="flex items-center w-full text-left py-2 px-3 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors text-sm border-t border-gray-200 mt-2 pt-2"
                >
                  <FiSettings className="mr-3" size={16} />
                  Admin Dashboard
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;