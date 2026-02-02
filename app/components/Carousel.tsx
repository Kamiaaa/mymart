"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface Slide {
  src: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
}

const Carousel = () => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Homepage slides
  const slides: Slide[] = [
    {
      src: "/img/banner1.jpg",
      title: "New Arrivals",
      subtitle: "Discover the latest trends in our collection",
      buttonText: "Shop Now",
      buttonLink: "/new-arrivals",
    },
    {
      src: "/img/banner2.jpg",
      title: "Exclusive Offers",
      subtitle: "Up to 50% off on selected items",
      buttonText: "Grab Offer",
      buttonLink: "/offers",
    },
    {
      src: "/img/banner3.jpg",
      title: "Best Sellers",
      subtitle: "Our most popular products loved by customers",
      buttonText: "View Collection",
      buttonLink: "/best-sellers",
    },
  ];

  const scrollToIndex = (index: number) => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({
        left: carouselRef.current.clientWidth * index,
        behavior: "smooth",
      });
      setCurrentIndex(index);
    }
  };

  const scroll = (direction: "left" | "right") => {
    const newIndex =
      direction === "left"
        ? (currentIndex - 1 + slides.length) % slides.length
        : (currentIndex + 1) % slides.length;
    scrollToIndex(newIndex);
  };

  // Autoplay every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      scroll("right");
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  return (
    <div className="relative w-full">
      {/* Left Button */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-white rounded-full shadow hover:bg-gray-100"
      >
        <FiChevronLeft size={24} />
      </button>

      {/* Slides */}
      <div ref={carouselRef} className="flex overflow-hidden snap-x snap-mandatory">
        {slides.map((slide, index) => (
          <div key={index} className="flex-shrink-0 w-full snap-center relative">
            <Image
              src={slide.src}
              alt={slide.title}
              width={1600}
              height={600}
              className="w-full h-[400px] md:h-[500px] object-cover"
              priority={index === 0}
            />

            {/* Text Overlay with left gap */}
            <div className="absolute inset-0 flex items-center">
              <div className="pl-6 md:pl-24 lg:pl-32 max-w-lg text-white">
                <h2 className="text-3xl md:text-5xl font-bold mb-4 drop-shadow-lg">
                  {slide.title}
                </h2>
                <p className="text-lg md:text-xl mb-6 drop-shadow-md">
                  {slide.subtitle}
                </p>
                <a
                  href={slide.buttonLink}
                  className="inline-block bg-white text-black px-5 py-2 rounded-full shadow hover:bg-gray-200 transition"
                >
                  {slide.buttonText}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Right Button */}
      <button
        onClick={() => scroll("right")}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-white rounded-full shadow hover:bg-gray-100"
      >
        <FiChevronRight size={24} />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToIndex(index)}
            className={`w-3 h-3 rounded-full transition ${
              currentIndex === index ? "bg-white" : "bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;
