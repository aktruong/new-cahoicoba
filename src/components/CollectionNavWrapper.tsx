'use client';

import { usePathname } from 'next/navigation';
import { CollectionNav } from './CollectionNav';
import { useCollectionContext } from '@/contexts/CollectionContext';
import { useEffect } from 'react';

export function CollectionNavWrapper() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const { collections, loading } = useCollectionContext();

  if (!isHomePage) return null;

  return <CollectionNav />;
} 