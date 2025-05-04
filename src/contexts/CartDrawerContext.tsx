'use client';

import React, { createContext, useContext, useState } from 'react';

interface CartDrawerContextType {
  isOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
}

const CartDrawerContext = createContext<CartDrawerContextType | undefined>(undefined);

export function CartDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openCartDrawer = () => {
    console.log('Opening cart drawer');
    setIsOpen(true);
  };

  const closeCartDrawer = () => {
    console.log('Closing cart drawer');
    setIsOpen(false);
  };

  return (
    <CartDrawerContext.Provider value={{ isOpen, openCartDrawer, closeCartDrawer }}>
      {children}
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer() {
  const context = useContext(CartDrawerContext);
  if (context === undefined) {
    throw new Error('useCartDrawer must be used within a CartDrawerProvider');
  }
  return context;
} 