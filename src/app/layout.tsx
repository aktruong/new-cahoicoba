import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CartDrawerProvider } from '@/contexts/CartDrawerContext';
import { CartProvider } from '@/contexts/CartContext';
import { CollectionProvider } from '@/contexts/CollectionContext';
import CartDrawer from '@/components/CartDrawer';
import { Header } from '@/components/Header';
import { CollectionNav } from '@/components/CollectionNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Cá Hồi Cá',
  description: 'Cá hồi tươi sống nhập khẩu',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <CartProvider>
          <CartDrawerProvider>
            <CollectionProvider>
              <div className="min-h-screen flex flex-col">
                <Header />
                <CollectionNav />
                <main className="flex-grow pt-28">
                  {children}
                </main>
              </div>
              <CartDrawer />
            </CollectionProvider>
          </CartDrawerProvider>
        </CartProvider>
      </body>
    </html>
  );
}
