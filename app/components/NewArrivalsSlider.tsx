"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  images: string[];
  rating: number;
  reviews: number;
  inStock: boolean;
}

export default function NewArrivalsSlider() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const res = await fetch("/api/products/new");
        const data = await res.json();
        setProducts(data);
        setCurrentIndex(data.length); // start in middle
      } catch (error) {
        console.error("Error fetching new arrivals:", error);
      }
    };

    fetchNewArrivals();
  }, []);

  // Responsive breakpoints
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2);
      } else {
        setItemsPerView(4);
      }
    };

    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);
    return () => window.removeEventListener("resize", updateItemsPerView);
  }, []);

  const nextSlide = () => setCurrentIndex((prev) => prev + 1);
  const prevSlide = () => setCurrentIndex((prev) => prev - 1);

  // Reset transition for infinite loop
  const handleTransitionEnd = () => {
    if (products.length === 0) return;
    if (currentIndex >= products.length * 2) {
      setTransitionEnabled(false);
      setCurrentIndex(products.length);
    } else if (currentIndex <= products.length - 1) {
      setTransitionEnabled(false);
      setCurrentIndex(products.length * 2 - 1);
    }
  };

  useEffect(() => {
    if (!transitionEnabled) {
      const id = setTimeout(() => setTransitionEnabled(true), 50);
      return () => clearTimeout(id);
    }
  }, [transitionEnabled]);

  // Autoplay with pause on hover
  useEffect(() => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);

    if (!isHovered && products.length > 0) {
      autoplayRef.current = setInterval(() => {
        nextSlide();
      }, 3000);
    }

    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [products, itemsPerView, isHovered]);

  const formatCurrency = (amount: number) => (
    <span className="flex items-baseline">
      <span className="text-lg font-extrabold mr-0.5">৳</span>
      <span>{amount.toFixed(2)}</span>
    </span>
  );

  if (products.length === 0) {
    return <p className="text-center py-10">No new arrivals found.</p>;
  }

  const loopProducts = [...products, ...products, ...products];

  return (
    <div
      className="relative w-full max-w-7xl mx-auto py-10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h2 className="text-2xl font-bold mb-6 text-center">🆕 New Arrivals</h2>

      <div className="relative overflow-hidden">
        <div
          className="flex"
          style={{
            transform: `translateX(-${(currentIndex * 100) / itemsPerView}%)`,
            transition: transitionEnabled ? "transform 0.5s ease-in-out" : "none",
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {loopProducts.map((product, index) => (
            <div
              key={`${product._id}-${index}`}
              className="p-4 flex-shrink-0"
              style={{ flex: `0 0 ${100 / itemsPerView}%` }}
            >
              <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 group border border-gray-100">
                {/* Image */}
                <div className="w-full h-52 relative flex justify-center bg-gray-100 overflow-hidden">
                  {product.images?.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      width={400}
                      height={250}
                      className="w-auto h-52 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No Image</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>

                  {/* Price */}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="ml-2 text-sm text-gray-500 line-through">
                        {formatCurrency(product.originalPrice)}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/products/${product._id}`}
                    className="mt-3 inline-block bg-orange-600 hover:bg-orange-700 text-white font-medium py-1.5 px-3 rounded-lg text-xs shadow-sm transition-colors"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation buttons */}
      <button
        onClick={prevSlide}
        className="absolute top-1/2 left-2 -translate-y-1/2 text-gray-50 bg-orange-600 p-2 rounded-full shadow hover:bg-orange-700"
      >
        <FaChevronLeft />
      </button>
      <button
        onClick={nextSlide}
        className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-50 bg-orange-600 p-2 rounded-full shadow hover:bg-orange-700"
      >
        <FaChevronRight />
      </button>
    </div>
  );
}
