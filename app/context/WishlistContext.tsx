// context/WishlistContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface WishlistItem {
  _id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  inStock: boolean;
  addedAt: string;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  isLoading: boolean;
  addToWishlist: (product: any) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  getWishlistItemsCount: () => number;
  clearWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

interface WishlistProviderProps {
  children: ReactNode;
}

export const WishlistProvider: React.FC<WishlistProviderProps> = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      fetchWishlist();
    } else if (status === 'unauthenticated') {
      // Load from localStorage for guests
      loadGuestWishlist();
    }
  }, [status]);

  const fetchWishlist = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/wishlist');
      if (response.ok) {
        const data = await response.json();
        setWishlistItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGuestWishlist = () => {
    if (typeof window !== 'undefined') {
      const guestWishlist = localStorage.getItem('guestWishlist');
      if (guestWishlist) {
        setWishlistItems(JSON.parse(guestWishlist));
      }
    }
    setIsLoading(false);
  };

  const saveGuestWishlist = (items: WishlistItem[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('guestWishlist', JSON.stringify(items));
    }
  };

  const addToWishlist = async (product: any) => {
    const wishlistItem = {
      _id: product._id,
      productId: product.productId,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      images: product.images,
      inStock: product.inStock,
      addedAt: new Date().toISOString()
    };

    if (session) {
      // Authenticated user - save to database
      try {
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId: product._id }),
        });

        if (response.ok) {
          setWishlistItems(prev => {
            const newItems = [...prev, wishlistItem];
            return newItems;
          });
        }
      } catch (error) {
        console.error('Error adding to wishlist:', error);
      }
    } else {
      // Guest user - save to localStorage
      setWishlistItems(prev => {
        const existingItem = prev.find(item => item._id === product._id);
        if (existingItem) return prev; // Already in wishlist
        
        const newItems = [...prev, wishlistItem];
        saveGuestWishlist(newItems);
        return newItems;
      });
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (session) {
      try {
        const response = await fetch('/api/wishlist', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId }),
        });

        if (response.ok) {
          setWishlistItems(prev => prev.filter(item => item._id !== productId));
        }
      } catch (error) {
        console.error('Error removing from wishlist:', error);
      }
    } else {
      setWishlistItems(prev => {
        const newItems = prev.filter(item => item._id !== productId);
        saveGuestWishlist(newItems);
        return newItems;
      });
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some(item => item._id === productId);
  };

  const getWishlistItemsCount = () => {
    return wishlistItems.length;
  };

  const clearWishlist = async () => {
    if (session) {
      try {
        const response = await fetch('/api/wishlist', {
          method: 'DELETE',
        });

        if (response.ok) {
          setWishlistItems([]);
        }
      } catch (error) {
        console.error('Error clearing wishlist:', error);
      }
    } else {
      setWishlistItems([]);
      saveGuestWishlist([]);
    }
  };

  const value = {
    wishlistItems,
    isLoading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    getWishlistItemsCount,
    clearWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};