'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCollectionContext } from '@/contexts/CollectionContext';

interface Collection {
  id: string;
  name: string;
  slug: string;
}

export const CollectionNav: React.FC = () => {
  const { collections, loading, error } = useCollectionContext();
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const collectionElements = document.querySelectorAll('[data-collection-id]');
      let currentCollection = null;

      collectionElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top <= window.innerHeight * 0.5 && rect.bottom >= window.innerHeight * 0.5;
        
        if (isVisible) {
          currentCollection = element.getAttribute('data-collection-id');
        }
      });

      if (currentCollection) {
        setActiveCollection(currentCollection);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [collections]);

  const scrollToCollection = (collectionId: string) => {
    setActiveCollection(collectionId);
    const element = document.querySelector(`[data-collection-id="${collectionId}"]`);
    if (element) {
      const headerHeight = 64;
      const navHeight = 44;
      const offset = headerHeight + navHeight;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200 h-11">
        <div className="container mx-auto px-4 h-full">
          <div className="flex items-center h-full overflow-x-auto space-x-6 hide-scrollbar">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200 h-11">
        <div className="container mx-auto px-4 h-full">
          <div className="flex items-center h-full overflow-x-auto space-x-6 hide-scrollbar">
            <span className="text-red-500">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200 h-11">
      <div className="container mx-auto px-4 h-full">
        <div ref={navRef} className="flex items-center h-full overflow-x-auto space-x-6 hide-scrollbar">
          {collections.map((collection: Collection) => {
            const isActive = activeCollection === collection.id;
            return (
              <motion.button
                key={collection.id}
                data-collection-button={collection.id}
                onClick={() => scrollToCollection(collection.id)}
                className="relative flex flex-col items-center pb-1"
              >
                <div className="relative">
                  <motion.span
                    initial={false}
                    animate={{
                      color: isActive ? '#2563eb' : '#6b7280',
                      fontWeight: isActive ? 600 : 400,
                    }}
                    transition={{ duration: 0.2 }}
                    className="text-sm whitespace-nowrap"
                  >
                    {collection.name}
                  </motion.span>

                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: '100%', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600"
                      />
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
} 