'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Collection {
  id: string;
  name: string;
  slug: string;
}

interface CollectionContextType {
  collections: Collection[];
  loading: boolean;
  error: string | null;
}

const CollectionContext = createContext<CollectionContextType>({
  collections: [],
  loading: true,
  error: null,
});

export function CollectionProvider({ children }: { children: React.ReactNode }) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch('/api/collections');
        const data = await response.json();
        setCollections(data);
        setLoading(false);
      } catch (err) {
        setError('Không thể tải danh sách collections');
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  return (
    <CollectionContext.Provider value={{ collections, loading, error }}>
      {children}
    </CollectionContext.Provider>
  );
}

export const useCollectionContext = () => useContext(CollectionContext); 