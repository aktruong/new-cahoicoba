export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  currencyCode: string;
  product: {
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
  };
  featuredAsset?: {
    id: string;
    name: string;
    source: string;
    preview: string;
    width: number;
    height: number;
  };
}

export interface CartLine {
  id: string;
  quantity: number;
  productVariant: ProductVariant;
}

export interface ActiveOrder {
  id: string;
  total: number;
  totalQuantity: number;
  currencyCode: string;
  state: string;
  lines: {
    id: string;
    quantity: number;
    productVariant: ProductVariant;
  }[];
}

export interface Cart {
  id: string;
  lines: CartLine[];
  total: number;
  currencyCode: string;
  activeOrder?: any;
}

export type ActiveOrderResponse = {
  id: string;
  code: string;
  state: string;
  total: number;
  subTotal: number;
  shipping: number;
  lines: {
    id: string;
    quantity: number;
    linePrice: number;
    productVariant: {
      id: string;
      name: string;
      sku: string;
      price: number;
    };
  }[];
} | null; 