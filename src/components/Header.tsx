'use client';

import Link from 'next/link';
import { CartButton } from './CartButton';
import { useState, useEffect } from 'react';
import { navigationItems } from '@/config/navigation';
import { usePathname } from 'next/navigation';

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-gray-200 bg-white`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center">
            <img
              src="/logo.webp"
              alt="Cá hồi cô ba Đà Lạt"
              className="h-12 w-auto"
            />
          </Link>
          
          {/* Navigation Menu */}
          <nav className="hidden">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  pathname === item.href
                    ? 'text-primary'
                    : 'text-gray-600 hover:text-primary'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <CartButton />
        </div>
      </div>
    </header>
  );
}; 