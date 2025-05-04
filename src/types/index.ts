export interface Cart {
  id: string;
  lines: CartLine[];
  total: number;
  totalWithTax: number;
  currencyCode: string;
  activeOrder: any;
}

export interface CartLine {
  id: string;
  quantity: number;
  productVariant: {
    id: string;
    name: string;
    sku: string;
    price: number;
    priceWithTax: number;
    currencyCode: string;
    product?: {
      id: string;
      name: string;
      slug: string;
      description: string;
      featuredAsset?: {
        id: string;
        name: string;
        source: string;
        preview: string;
        width: number;
        height: number;
      };
    } | undefined;
  };
}

export interface ActiveOrderResponse {
  data?: {
    activeOrder?: {
      id: string;
      total: number;
      totalWithTax: number;
      currencyCode: string;
      lines: {
        id: string;
        quantity: number;
        productVariant: {
          id: string;
          name: string;
          sku: string;
          price: number;
          priceWithTax: number;
          currencyCode: string;
          product?: {
            id: string;
            name: string;
            slug: string;
            description: string;
            featuredAsset?: {
              id: string;
              name: string;
              source: string;
              preview: string;
              width: number;
              height: number;
            };
          } | undefined;
        };
      }[];
    };
  };
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceWithTax: number;
  featuredAsset?: {
    id: string;
    name: string;
    source: string;
    preview: string;
    width: number;
    height: number;
  };
} 