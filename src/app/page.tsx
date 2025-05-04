'use client';

import { useState, useEffect } from 'react';
import { Collection } from '@/components/Collection';

interface Product {
  id: string;
  name: string;
  priceWithTax: number;
  currencyCode: string;
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    featuredAsset: {
      id: string;
      preview: string;
      source: string;
    };
  };
}

interface CollectionData {
  id: string;
  name: string;
  slug: string;
  description: string;
  featuredAsset: {
    preview: string;
    source: string;
  };
  productVariants: {
    items: Product[];
  };
}

const GET_COLLECTIONS = /*GraphQL*/`
  query GetCollections {
    collections {
      items {
        id
        name
        slug
        description
        featuredAsset {
          preview
          source
        }
        productVariants {
          items {
            id
            name
            priceWithTax
            currencyCode
            product {
              id
              name
              slug
              description
              featuredAsset {
                id
                preview
                source
              }
            }
          }
        }
      }
    }
  }
`;

export default function HomePage() {
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_SHOP_API_URL) {
          throw new Error('NEXT_PUBLIC_SHOP_API_URL is not defined');
        }

        if (!process.env.NEXT_PUBLIC_VENDURE_TOKEN) {
          throw new Error('NEXT_PUBLIC_VENDURE_TOKEN is not defined');
        }

        const response = await fetch(process.env.NEXT_PUBLIC_SHOP_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'vendure-token': process.env.NEXT_PUBLIC_VENDURE_TOKEN,
          },
          credentials: 'include',
          body: JSON.stringify({
            query: GET_COLLECTIONS,
            variables: {},
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.errors) {
          throw new Error(result.errors[0].message);
        }

        if (!result.data?.collections?.items) {
          throw new Error('Invalid response format');
        }

        setCollections(result.data.collections.items);
      } catch (err) {
        console.error('Error fetching collections:', err);
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải collections');
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {collections.map((collection) => (
        <Collection key={collection.id} collection={collection} />
      ))}
    </div>
  );
}
