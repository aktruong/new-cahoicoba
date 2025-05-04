'use client';

import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react';
import { getActiveOrder, transitionOrderToState } from '@/lib/vendure';
import type { ActiveOrderResponse } from '@/types';

// Queries
const ADD_ITEM_MUTATION = `
  mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {
    addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
      ... on Order {
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
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

const UPDATE_QUANTITY_MUTATION = `
  mutation AdjustOrderLine($orderLineId: ID!, $quantity: Int!) {
    adjustOrderLine(orderLineId: $orderLineId, quantity: $quantity) {
      ... on Order {
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
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

const REMOVE_ITEM_MUTATION = `
  mutation RemoveOrderLine($orderLineId: ID!) {
    removeOrderLine(orderLineId: $orderLineId) {
      ... on Order {
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
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

// Helper function to fetch GraphQL
export const fetchGraphQL = async (query: string, variables: any = {}, loadCart?: () => Promise<void>) => {
  try {
    console.log('Gọi API GraphQL:', { query, variables });
    const response = await fetch(process.env.NEXT_PUBLIC_SHOP_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const result = await response.json();
    console.log('Kết quả API:', result);

    if (result.errors) {
      // Kiểm tra loại lỗi
      const errorMessage = result.errors[0].message;
      console.error('Lỗi API:', errorMessage);
      
      if (errorMessage.includes('OrderLine') && loadCart) {
        // Nếu lỗi liên quan đến OrderLine, load lại giỏ hàng
        console.log('Đang load lại giỏ hàng do lỗi OrderLine');
        await loadCart();
        throw new Error('Sản phẩm không còn tồn tại trong giỏ hàng. Vui lòng kiểm tra lại.');
      }
      throw new Error(errorMessage);
    }

    return result;
  } catch (error) {
    console.error('Lỗi khi gọi API:', error);
    throw error;
  }
};

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
}

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  addToCart: (variantId: string, quantity: number) => Promise<void>;
  removeFromCart: (lineId: string) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  loadCart: () => Promise<void>;
  clearCart: () => void;
  showMenuQuantityControls: { [key: string]: boolean };
  setShowMenuQuantityControls: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
  totalQuantity: number;
}

interface CartState {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  showMenuQuantityControls: { [key: string]: boolean };
}

type CartAction =
  | { type: 'SET_CART'; payload: Cart | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_QUANTITY'; payload: { lineId: string; quantity: number } }
  | { type: 'UPDATE_QUANTITY_OPTIMISTIC'; payload: { lineId: string; quantity: number } }
  | { type: 'REMOVE_LINE'; payload: string }
  | { type: 'SET_MENU_CONTROLS'; payload: { [key: string]: boolean } };

const initialState: CartState = {
  cart: null,
  loading: false,
  error: null,
  showMenuQuantityControls: {},
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_CART':
      return { ...state, cart: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'UPDATE_QUANTITY':
      if (!state.cart) return state;
      return {
        ...state,
        cart: {
          ...state.cart,
          lines: state.cart.lines.map(line =>
            line.id === action.payload.lineId
              ? { ...line, quantity: action.payload.quantity }
              : line
          ),
        },
      };
    case 'UPDATE_QUANTITY_OPTIMISTIC':
      if (!state.cart) return state;
      return {
        ...state,
        cart: {
          ...state.cart,
          lines: state.cart.lines.map(line =>
            line.id === action.payload.lineId
              ? { ...line, quantity: action.payload.quantity }
              : line
          ),
        },
      };
    case 'REMOVE_LINE':
      if (!state.cart) return state;
      return {
        ...state,
        cart: {
          ...state.cart,
          lines: state.cart.lines.filter(line => line.id !== action.payload),
        },
      };
    case 'SET_MENU_CONTROLS':
      return { ...state, showMenuQuantityControls: action.payload };
    default:
      return state;
  }
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart từ Vendure khi component mount
  useEffect(() => {
    loadCart();
  }, []);

  const totalQuantity = useMemo(() => 
    state.cart?.lines.reduce((sum, line) => sum + line.quantity, 0) || 0,
    [state.cart?.lines]
  );

  // Cập nhật fetchGraphQL để xử lý session token
  const fetchGraphQLWithSession = async (query: string, variables?: any) => {
    try {
      if (!process.env.NEXT_PUBLIC_SHOP_API_URL) {
        throw new Error('NEXT_PUBLIC_SHOP_API_URL is not defined');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Lấy session token từ cookie nếu có
      const vendureToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('vendure-token='))
        ?.split('=')[1];

      if (vendureToken) {
        headers['vendure-token'] = vendureToken;
      }

      const response = await fetch(process.env.NEXT_PUBLIC_SHOP_API_URL, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Lưu session token từ response header nếu có
      const newToken = response.headers.get('vendure-token');
      if (newToken) {
        document.cookie = `vendure-token=${newToken}; path=/`;
      }

      const result = await response.json();

      if (result.errors) {
        console.error('GraphQL Errors:', result.errors);
        const errorMessage = result.errors.map((err: any) => err.message).join(', ');
        throw new Error(`GraphQL Error: ${errorMessage}`);
      }

      return result;
    } catch (error) {
      console.error('Error in fetchGraphQL:', error);
      if (error instanceof Error) {
        throw new Error(`API Error: ${error.message}`);
      }
      throw error;
    }
  };

  const cartValue = useMemo(() => ({
    cart: state.cart,
    loading: state.loading,
    error: state.error,
    showMenuQuantityControls: state.showMenuQuantityControls,
    totalQuantity
  }), [state.cart, state.loading, state.error, state.showMenuQuantityControls, totalQuantity]);

  const loadCart = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Chuyển sang trạng thái active trước
      await transitionOrderToState('ArrangingPayment');

      const result = await fetchGraphQLWithSession(`
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

      if (result.data?.activeOrder) {
        const order = result.data.activeOrder;
        dispatch({
          type: 'SET_CART',
          payload: {
            id: order.id,
            lines: order.lines.map((line: any) => ({
              id: line.id,
              quantity: line.quantity,
              productVariant: {
                id: line.productVariant.id,
                name: line.productVariant.name,
                sku: line.productVariant.sku,
                price: line.productVariant.price,
                priceWithTax: line.productVariant.priceWithTax,
                currencyCode: line.productVariant.currencyCode,
                product: {
                  id: line.productVariant.product.id,
                  name: line.productVariant.product.name,
                  slug: line.productVariant.product.slug,
                  description: line.productVariant.product.description,
                  featuredAsset: line.productVariant.product.featuredAsset
                }
              }
            })),
            total: order.total,
            totalWithTax: order.totalWithTax,
            currencyCode: order.currencyCode,
            activeOrder: order
          }
        });
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Lỗi không xác định' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const updateQuantity = useCallback(async (lineId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY_OPTIMISTIC', payload: { lineId, quantity } });

    try {
      const response = await fetchGraphQLWithSession(UPDATE_QUANTITY_MUTATION, {
        orderLineId: lineId,
        quantity,
      });

      if (response.data?.adjustOrderLine) {
        const order = response.data.adjustOrderLine;
        dispatch({
          type: 'SET_CART',
          payload: {
            id: order.id,
            lines: order.lines.map((line: any) => ({
              id: line.id,
              quantity: line.quantity,
              productVariant: {
                id: line.productVariant.id,
                name: line.productVariant.name,
                sku: line.productVariant.sku,
                price: line.productVariant.price,
                priceWithTax: line.productVariant.priceWithTax,
                currencyCode: line.productVariant.currencyCode,
                product: {
                  id: line.productVariant.product.id,
                  name: line.productVariant.product.name,
                  slug: line.productVariant.product.slug,
                  description: line.productVariant.product.description,
                  featuredAsset: line.productVariant.product.featuredAsset
                }
              }
            })),
            total: order.total,
            totalWithTax: order.totalWithTax,
            currencyCode: order.currencyCode,
            activeOrder: order
          }
        });
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Lỗi không xác định' });
    }
  }, []);

  const removeFromCart = useCallback(async (lineId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      const response = await fetchGraphQLWithSession(REMOVE_ITEM_MUTATION, {
        orderLineId: lineId,
      });

      if (response.data?.removeOrderLine) {
        const order = response.data.removeOrderLine;
        dispatch({
          type: 'SET_CART',
          payload: {
            id: order.id,
            lines: order.lines.map((line: any) => ({
              id: line.id,
              quantity: line.quantity,
              productVariant: {
                id: line.productVariant.id,
                name: line.productVariant.name,
                sku: line.productVariant.sku,
                price: line.productVariant.price,
                priceWithTax: line.productVariant.priceWithTax,
                currencyCode: line.productVariant.currencyCode,
                product: {
                  id: line.productVariant.product.id,
                  name: line.productVariant.product.name,
                  slug: line.productVariant.product.slug,
                  description: line.productVariant.product.description,
                  featuredAsset: line.productVariant.product.featuredAsset
                }
              }
            })),
            total: order.total,
            totalWithTax: order.totalWithTax,
            currencyCode: order.currencyCode,
            activeOrder: order
          }
        });
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Lỗi không xác định' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const addToCart = useCallback(async (variantId: string, quantity: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      const response = await fetchGraphQLWithSession(ADD_ITEM_MUTATION, {
        productVariantId: variantId,
        quantity,
      });

      if (response.data?.addItemToOrder) {
        const order = response.data.addItemToOrder;
        dispatch({
          type: 'SET_CART',
          payload: {
            id: order.id,
            lines: order.lines.map((line: any) => ({
              id: line.id,
              quantity: line.quantity,
              productVariant: {
                id: line.productVariant.id,
                name: line.productVariant.name,
                sku: line.productVariant.sku,
                price: line.productVariant.price,
                priceWithTax: line.productVariant.priceWithTax,
                currencyCode: line.productVariant.currencyCode,
                product: {
                  id: line.productVariant.product.id,
                  name: line.productVariant.product.name,
                  slug: line.productVariant.product.slug,
                  description: line.productVariant.product.description,
                  featuredAsset: line.productVariant.product.featuredAsset
                }
              }
            })),
            total: order.total,
            totalWithTax: order.totalWithTax,
            currencyCode: order.currencyCode,
            activeOrder: order
          }
        });
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Lỗi không xác định' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'SET_CART', payload: null });
  }, []);

  const setShowMenuQuantityControls = useCallback((value: React.SetStateAction<{ [key: string]: boolean }>) => {
    if (typeof value === 'function') {
      dispatch({ type: 'SET_MENU_CONTROLS', payload: value(state.showMenuQuantityControls) });
    } else {
      dispatch({ type: 'SET_MENU_CONTROLS', payload: value });
    }
  }, [state.showMenuQuantityControls]);

  const contextValue = useMemo(() => ({
    ...cartValue,
    addToCart,
    removeFromCart,
    updateQuantity,
    loadCart,
    clearCart,
    setShowMenuQuantityControls
  }), [cartValue, addToCart, removeFromCart, updateQuantity, loadCart, clearCart, setShowMenuQuantityControls]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
}

// Export useCart as an alias for useCartContext for backward compatibility
export const useCart = useCartContext;