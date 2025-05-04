'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCartContext } from '@/contexts/CartContext';
import { useCartDrawer } from '@/contexts/CartDrawerContext';

export function CartButton() {
  const { totalQuantity } = useCartContext();
  const { openCartDrawer } = useCartDrawer();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Cart button clicked');
    openCartDrawer();
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClick}
        className="relative p-2 text-gray-600 hover:text-gray-900"
      >
        <ShoppingCart className="h-6 w-6" />
        {totalQuantity > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {totalQuantity}
          </span>
        )}
      </button>
    </div>
  );
} 