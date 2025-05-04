import { GET_COLLECTIONS, CollectionsResponse, vendureFetch } from "@/lib/vendure";
import { NavigationMenu } from "@/components/NavigationMenu";

export async function CollectionsProvider() {
  const data = await vendureFetch<CollectionsResponse>(GET_COLLECTIONS);
  const collections = data.collections.items;

  return <NavigationMenu collections={collections} />;
} 