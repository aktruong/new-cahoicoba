'use client';

import { Collection } from '@/components/Collection';
import { CollectionProductsResponse } from '@/lib/vendure';

interface CollectionContentProps {
  collection: CollectionProductsResponse['collection'];
}

export function CollectionContent({ collection }: CollectionContentProps) {
  return <Collection collection={collection} />;
} 