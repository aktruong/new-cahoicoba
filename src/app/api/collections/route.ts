import { NextResponse } from 'next/server';
import { fetchGraphQL } from '@/lib/graphql';

const TIMEOUT = 5000; // 5 seconds timeout

export async function GET() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    console.log('Fetching collections from:', process.env.NEXT_PUBLIC_SHOP_API_URL);
    
    const result = await fetchGraphQL(`
      query GetCollections {
        collections {
          items {
            id
            name
            slug
          }
        }
      }
    `);

    clearTimeout(timeoutId);

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    if (!result.data?.collections?.items) {
      throw new Error('Invalid response format');
    }

    return NextResponse.json(result.data.collections.items);
  } catch (error) {
    console.error('Error fetching collections:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout' },
          { status: 504 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
} 