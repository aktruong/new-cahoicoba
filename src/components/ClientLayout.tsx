'use client';

import { Header } from '@/components/Header';
import { CollectionNav } from '@/components/CollectionNav';
import { CartProvider } from '@/contexts/CartContext';
import { CartDrawerProvider } from '@/contexts/CartDrawerContext';
import { CollectionProvider } from '@/contexts/CollectionContext';
import { Toaster } from 'react-hot-toast';
import { usePathname } from 'next/navigation';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <CartProvider>
      <CartDrawerProvider>
        <CollectionProvider>
          <Header />
          {pathname === '/' && <CollectionNav />}
          <main className="min-h-screen bg-gray-50 pt-20">
            {children}
          </main>
          <Toaster />
        </CollectionProvider>
      </CartDrawerProvider>
    </CartProvider>
  );
} 