import { Metadata } from 'next';
import { ProductContent } from './ProductContent';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `Sản phẩm - ${resolvedParams.slug}`,
    description: `Chi tiết sản phẩm ${resolvedParams.slug}`,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const resolvedParams = await params;
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_SHOP_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'vendure-token': process.env.NEXT_PUBLIC_VENDURE_TOKEN!,
      },
      body: JSON.stringify({
        query: `
          query GetProduct($slug: String!) {
            product(slug: $slug) {
              id
              name
              slug
              description
              featuredAsset {
                id
                name
                source
                preview
                width
                height
              }
              variants {
                id
                name
                priceWithTax
                currencyCode
                featuredAsset {
                  id
                  name
                  source
                  preview
                  width
                  height
                }
              }
            }
          }
        `,
        variables: {
          slug: resolvedParams.slug,
        },
      }),
    });

    const result = await response.json();
    if (result.errors || !result.data?.product) {
      throw new Error('Không tìm thấy sản phẩm');
    }

    return <ProductContent product={result.data.product} />;
  } catch (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>Không tìm thấy sản phẩm</p>
        </div>
      </div>
    );
  }
} 