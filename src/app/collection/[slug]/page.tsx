'use client';

import React from 'react';
import { Collection } from '@/components/Collection';
import { GET_COLLECTION_PRODUCTS, vendureFetch, CollectionProductsResponse } from '@/lib/vendure';

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[]>>;
}) {
  const [data, setData] = React.useState<CollectionProductsResponse | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const resolvedParams = await params;
        const result = await vendureFetch<CollectionProductsResponse>(GET_COLLECTION_PRODUCTS, { slug: resolvedParams.slug });
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Có lỗi xảy ra'));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params]);

  if (loading) {
    return <div>Đang tải...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error.message}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 text-sm text-red-600 hover:text-red-800"
              >
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.collection) {
    return <div>Không tìm thấy danh mục</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Collection collection={data.collection} />
    </div>
  );
} 