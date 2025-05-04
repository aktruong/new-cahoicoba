import { GET_COLLECTION_PRODUCTS, CollectionProductsResponse, vendureFetch } from './vendure';

export async function fetchCollectionBySlug(slug: string) {
  try {
    const response = await vendureFetch<CollectionProductsResponse>(GET_COLLECTION_PRODUCTS, {
      slug,
    });

    if (!response.collection) {
      return null;
    }

    return response.collection;
  } catch (error) {
    console.error('Error fetching collection:', error);
    return null;
  }
} 