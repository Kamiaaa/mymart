"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Category {
  name: string;
  image: string;
  productCount: number;
}

const CategoryCard = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data);
    };
    fetchCategories();
  }, []);

  return (
    <section className="my-8 px-6">
      <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        {categories.map((cat) => (
          <div
            key={cat.name}
            onClick={() => router.push(`/category/${cat.name}`)}
            className="w-full max-w-sm rounded-2xl overflow-hidden shadow-md bg-white cursor-pointer hover:shadow-xl transition"
          >
            <img
              src={cat.image}
              alt={cat.name}
              className="h-48 w-auto mx-auto"
            />
            <div className="p-4 flex flex-col items-center text-center">
              <h3 className="text-lg font-semibold">{cat.name}</h3>
              {/* <p className="text-sm text-gray-500">{cat.productCount} products</p> */}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CategoryCard;
