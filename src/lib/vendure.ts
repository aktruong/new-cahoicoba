const API_URL = 'http://14.225.255.182:3000/shop-api';

// Cache for requests
const requestCache = new Map<string, Promise<any>>();

// Helper function to fetch GraphQL
async function fetchGraphQL(query: string, variables?: any) {
  try {
    if (!process.env.NEXT_PUBLIC_SHOP_API_URL) {
      throw new Error('NEXT_PUBLIC_SHOP_API_URL is not defined');
    }

    const response = await fetch(process.env.NEXT_PUBLIC_SHOP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'vendure-token': getVendureToken() || '',
      },
      credentials: 'include',
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return result;
  } catch (error) {
    console.error('Error in fetchGraphQL:', error);
    throw error;
  }
}

export interface ActiveOrder {
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
    };
  }[];
}

export interface ActiveOrderResponse {
  data?: {
    activeOrder?: ActiveOrder;
  };
}

export interface CreateCustomerInput {
  firstName: string;
  lastName: string;
  emailAddress: string;
  phoneNumber?: string;
}

export interface CreateAddressInput {
  fullName: string;
  company?: string;
  streetLine1: string;
  streetLine2?: string;
  city: string;
  province?: string;
  postalCode: string;
  countryCode: string;
  phoneNumber?: string;
}

export interface PaymentInput {
  method: string;
  metadata: Record<string, any>;
}

export interface EligibleShippingMethodsResponse {
  data: {
    eligibleShippingMethods: Array<{
      id: string;
      name: string;
      description: string;
      price: number;
      priceWithTax: number;
      code: string;
    }>;
  };
}

export interface EligiblePaymentMethodsResponse {
  data: {
    eligiblePaymentMethods: Array<{
      id: string;
      name: string;
      code: string;
      isEligible: boolean;
    }>;
  };
}

export async function vendureFetch<T>(query: string, variables = {}): Promise<T> {
  try {
    // Create cache key from query and variables
    const cacheKey = JSON.stringify({ query, variables });

    // Check if request is already in progress
    if (requestCache.has(cacheKey)) {
      return requestCache.get(cacheKey) as Promise<T>;
    }

    // Create new request
    const request = fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'vendure-token': getVendureToken() || '',
      },
      credentials: 'include',
      body: JSON.stringify({
        query,
        variables,
      }),
    }).then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const json = await response.json();
      
      if (json.errors) {
        console.error('GraphQL Errors:', json.errors);
        throw new Error(json.errors[0].message);
      }

      return json;
    });

    // Cache the request
    requestCache.set(cacheKey, request);

    // Remove from cache when done
    request.finally(() => {
      requestCache.delete(cacheKey);
    });

    return request as Promise<T>;
  } catch (error) {
    console.error('Error in vendureFetch:', error);
    throw error;
  }
}

export const ADD_TO_CART = `
  mutation AddItemToCart($productVariantId: ID!, $quantity: Int!) {
    addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
      ... on Order {
        id
        totalQuantity
        total
        totalWithTax
        currencyCode
        lines {
          id
          quantity
          productVariant {
            id
            name
            sku
            price
            priceWithTax
            currencyCode
            product {
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
            }
          }
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const ADJUST_ORDER_LINE = `
  mutation AdjustOrderLine($orderLineId: ID!, $quantity: Int!) {
    adjustOrderLine(orderLineId: $orderLineId, quantity: $quantity) {
      ... on Order {
        id
        code
        state
        total
        totalWithTax
        totalQuantity
        lines {
          id
          quantity
          productVariant {
            id
            sku
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
                name
                source
                preview
                width
                height
              }
            }
          }
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const SET_CUSTOMER_FOR_ORDER = `
  mutation SetCustomerForOrder($input: CreateCustomerInput!) {
    setCustomerForOrder(input: $input) {
      ... on Order {
        id
        code
        state
        total
        totalWithTax
        totalQuantity
        customer {
          id
          firstName
          lastName
          emailAddress
          phoneNumber
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const SET_ORDER_SHIPPING_ADDRESS = `
  mutation SetOrderShippingAddress($input: CreateAddressInput!) {
    setOrderShippingAddress(input: $input) {
      ... on Order {
        id
        shippingAddress {
          fullName
          streetLine1
          streetLine2
          city
          province
          postalCode
          phoneNumber
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const SET_SHIPPING_METHOD = `
  mutation SetShippingMethod($shippingMethodId: ID!) {
    setOrderShippingMethod(shippingMethodId: $shippingMethodId) {
      ... on Order {
        id
        shipping
        shippingWithTax
        shippingMethod {
          id
          name
          description
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const ADD_PAYMENT_TO_ORDER = `
  mutation AddPaymentToOrder($input: PaymentInput!) {
    addPaymentToOrder(input: $input) {
      ... on Order {
        id
        state
        payments {
          id
          amount
          state
          method
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const TRANSITION_ORDER_TO_STATE = `
  mutation TransitionOrderToState($state: String!) {
    transitionOrderToState(state: $state) {
      ... on Order {
        id
        state
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const SET_SHIPPING_ADDRESS = `
  mutation SetShippingAddress($input: CreateAddressInput!) {
    setOrderShippingAddress(input: $input) {
      ... on Order {
        id
        shippingAddress {
          fullName
          streetLine1
          streetLine2
          city
          province
          postalCode
          country
          phoneNumber
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const GET_ELIGIBLE_SHIPPING_METHODS = `
  query GetEligibleShippingMethods {
    eligibleShippingMethods {
      id
      name
      description
      price
      priceWithTax
    }
  }
`;

export const GET_ELIGIBLE_PAYMENT_METHODS = `
  query GetEligiblePaymentMethods {
    eligiblePaymentMethods {
      id
      name
      description
      isEligible
    }
  }
`;

export const ADD_PAYMENT = `
  mutation AddPaymentToOrder($input: PaymentInput!) {
    addPaymentToOrder(input: $input) {
      ... on Order {
        id
        state
        payments {
          id
          amount
          state
          method
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const TRANSITION_TO_STATE = `
  mutation TransitionOrderToState($state: String!) {
    transitionOrderToState(state: $state) {
      ... on Order {
        id
        state
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export async function setCustomerForOrder(input: CreateCustomerInput) {
  return vendureFetch<{ data: { setCustomerForOrder: { id: string } } }>(SET_CUSTOMER_FOR_ORDER, { input });
}

export async function setOrderShippingAddress(input: CreateAddressInput) {
  return vendureFetch<{ data: { setOrderShippingAddress: { id: string } } }>(SET_ORDER_SHIPPING_ADDRESS, { input });
}

export async function setShippingMethod(shippingMethodId: string) {
  return vendureFetch<{ data: { setOrderShippingMethod: { id: string } } }>(SET_SHIPPING_METHOD, { shippingMethodId });
}

export async function transitionOrderToState(state: string) {
  return vendureFetch<{ data: { transitionOrderToState: { id: string } } }>(TRANSITION_ORDER_TO_STATE, { state });
}

export const getEligibleShippingMethods = async (): Promise<EligibleShippingMethodsResponse> => {
  const query = `
    query GetEligibleShippingMethods {
      eligibleShippingMethods {
        id
        name
        description
        price
        priceWithTax
      }
    }
  `;
  return vendureFetch<EligibleShippingMethodsResponse>(query);
};

export async function getEligiblePaymentMethods(): Promise<EligiblePaymentMethodsResponse> {
  const query = `
    query GetEligiblePaymentMethods {
      eligiblePaymentMethods {
        id
        name
        description
        isEligible
      }
    }
  `;
  return vendureFetch<EligiblePaymentMethodsResponse>(query);
}

export async function getActiveOrder(): Promise<ActiveOrderResponse> {
  const response = await fetchGraphQL(`
    query GetActiveOrder {
      activeOrder {
        id
        total
        totalWithTax
        currencyCode
        lines {
          id
          quantity
          productVariant {
            id
            name
            sku
            price
            priceWithTax
            currencyCode
            product {
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
            }
          }
        }
      }
    }
  `);
  return response;
}

export const GET_ACTIVE_ORDER = `
  query GetActiveOrder {
    activeOrder {
      id
      code
      state
      total
      totalWithTax
      totalQuantity
      lines {
        id
        quantity
        productVariant {
          id
          name
          price
          priceWithTax
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
  }
`;

export async function addPaymentToOrder(input: PaymentInput) {
  return vendureFetch<{ data: { addPaymentToOrder: { id: string } } }>(ADD_PAYMENT_TO_ORDER, { input });
}

export const GET_PRODUCTS = `
  query GetProducts {
    products(options: { take: 100 }) {
      items {
        id
        name
        slug
        description
        featuredAsset {
          preview
        }
        variants {
          id
          name
          price
          currencyCode
        }
      }
    }
  }
`;

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  featuredAsset?: {
    preview: string;
  };
  variants: {
    id: string;
    name: string;
    price: number;
    currencyCode: string;
  }[];
}

export interface ProductsResponse {
  data: {
    products: {
      items: Product[];
    };
  };
}

export const GET_COLLECTIONS = `
  query GetCollections {
    collections {
      items {
        id
        name
        slug
        featuredAsset {
          preview
        }
      }
    }
  }
`;

export interface Collection {
  id: string;
  name: string;
  slug: string;
  featuredAsset?: {
    preview: string;
  };
}

export interface CollectionsResponse {
  collections: {
    items: Collection[];
  };
}

export const GET_COLLECTION_PRODUCTS = `
  query GetCollectionWithVariants($slug: String!) {
    collection(slug: $slug) {
      id
      name
      description
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
`;

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  priceWithTax: number;
  currencyCode: string;
  enabled: boolean;
  featuredAsset?: {
    preview: string;
  };
}

export interface CollectionProductsResponse {
  collection: {
    id: string;
    name: string;
    description: string;
    productVariants: {
      items: Array<{
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
      }>;
    };
  };
}

export const GET_PRODUCT = `
  query GetProduct($slug: String!) {
    product(slug: $slug) {
      id
      name
      slug
      description
      featuredAsset {
        preview
      }
      variants {
        id
        sku
        name
        priceWithTax
        currencyCode
        featuredAsset {
          preview
        }
      }
    }
  }
`;

export interface ProductResponse {
  data: {
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
      variants: Array<{
        id: string;
        name: string;
        priceWithTax: number;
        currencyCode: string;
        featuredAsset?: {
          id: string;
          name: string;
          source: string;
          preview: string;
          width: number;
          height: number;
        };
      }>;
    };
  };
}

export function getVendureToken() {
  return (
    document.cookie
      .split('; ')
      .find(row => row.startsWith('vendure-token='))
      ?.split('=')[1] || 
    process.env.NEXT_PUBLIC_VENDURE_TOKEN
  );
}

export const TRANSITION_TO_ACTIVE = `
  mutation {
    transitionToActive {
      ... on Order {
        id
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export async function transitionToActive() {
  return vendureFetch<{ data: { transitionToActive: { id: string } } }>(TRANSITION_TO_ACTIVE);
}