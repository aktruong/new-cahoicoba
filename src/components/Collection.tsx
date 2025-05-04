'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCartContext } from '@/contexts/CartContext';
import { CartLine } from '@/contexts/CartContext';
import toast from 'react-hot-toast';
import { QuantityAdjuster } from './QuantityAdjuster';
import debounce from 'lodash/debounce';
import { VendureAsset } from './VendureAsset';
import Image from 'next/image';
import { ProductImage } from './ProductImage';

interface Product {
  id: string;
  name: string;
  product: {
    id: string;
    slug: string;
    description: string;
  };
  featuredAsset: {
    preview: string;
  };
  priceWithTax: number;
  variants: Array<{
    id: string;
    priceWithTax: number;
    currencyCode: string;
  }>;
}

interface Collection {
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
}

interface CollectionProps {
  collection: Collection;
}

export const Collection: React.FC<CollectionProps> = React.memo(({ collection }) => {
  const router = useRouter();
  const cartContext = useCartContext();
  const { addToCart, updateQuantity, cart } = cartContext || {};
  const [showQuantityControls, setShowQuantityControls] = React.useState<{ [key: string]: boolean }>({});
  const [showMenuQuantityControls, setShowMenuQuantityControls] = React.useState<{ [key: string]: boolean }>({});
  const [isAnimating, setIsAnimating] = React.useState<{ [key: string]: boolean }>({});
  const [showAllProducts, setShowAllProducts] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const timeoutRefs = React.useRef<{ [key: string]: NodeJS.Timeout }>({});
  const isAdjustingRef = React.useRef<{ [key: string]: boolean }>({});
  const lastInteractionRef = React.useRef<{ [key: string]: number }>({});
  const lastQuantityChangeRef = React.useRef<{ [key: string]: number }>({});
  const quantityChangeTimeoutRef = React.useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Thêm ref để lưu trữ state
  const showQuantityControlsRef = React.useRef(showQuantityControls);
  const showMenuQuantityControlsRef = React.useRef(showMenuQuantityControls);

  // Cập nhật ref khi state thay đổi
  React.useEffect(() => {
    showQuantityControlsRef.current = showQuantityControls;
    showMenuQuantityControlsRef.current = showMenuQuantityControls;
  }, [showQuantityControls, showMenuQuantityControls]);

  // Cập nhật showQuantityControls khi items thay đổi
  React.useEffect(() => {
    if (!cart?.lines) return;
    
    const newState = { ...showQuantityControlsRef.current };
    const newMenuState = { ...showMenuQuantityControlsRef.current };
    let hasChanges = false;

    cart.lines.forEach((line: CartLine) => {
      if (!newState[line.productVariant.id]) {
        newState[line.productVariant.id] = false;
        hasChanges = true;
      }
      if (!newMenuState[line.productVariant.id]) {
        newMenuState[line.productVariant.id] = true;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setShowQuantityControls(newState);
      setShowMenuQuantityControls(newMenuState);
    }
  }, [cart?.lines]);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const PRODUCTS_PER_PAGE = isMobile ? 6 : 8;

  console.log('Collection data:', JSON.stringify(collection, null, 2));

  // Thêm ref để lưu trữ timeout
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Thêm xử lý sự kiện cuộn trang
  React.useEffect(() => {
    const handleScroll = debounce(() => {
      const productsWithControls = Object.entries(showQuantityControls)
        .filter(([_, value]) => value)
        .map(([key]) => key);

      productsWithControls.forEach(productId => {
        hideQuantityControls(productId);
      });
    }, 100);

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      handleScroll.cancel();
    };
  }, [showQuantityControls]);

  // Thêm useEffect để theo dõi thay đổi của items
  React.useEffect(() => {
    if (!cart?.lines) return;
    
    const newMenuState = { ...showMenuQuantityControls };
    cart.lines.forEach((line: CartLine) => {
      newMenuState[line.productVariant.id] = true;
    });
    setShowMenuQuantityControls(newMenuState);
  }, [cart?.lines]);

  const formatPrice = (price: number, currencyCode: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currencyCode || 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price / 100);
  };

  const formatDescription = (html: string) => {
    // Tạo một div tạm thời để chuyển đổi HTML entities
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Lấy nội dung văn bản thuần túy
    let plainText = tempDiv.textContent || tempDiv.innerText;
    
    // Loại bỏ các thẻ HTML còn sót lại
    plainText = plainText.replace(/<[^>]*>/g, ' ');
    
    // Loại bỏ khoảng trắng thừa
    plainText = plainText.replace(/\s+/g, ' ').trim();
    
    return plainText;
  };

  const handleCardClick = (slug: string) => {
    router.push(`/product/${slug}`);
  };

  const hideQuantityControls = (productId: string) => {
    if (isAdjustingRef.current[productId]) return;
    
    setIsAnimating(prev => ({ ...prev, [productId]: true }));
    setShowQuantityControls(prev => ({ ...prev, [productId]: false }));
    setShowMenuQuantityControls(prev => ({ ...prev, [productId]: true }));
    setIsAnimating(prev => ({ ...prev, [productId]: false }));
  };

  const resetTimeout = (productId: string) => {
    if (timeoutRefs.current[productId]) {
      clearTimeout(timeoutRefs.current[productId]);
    }
    lastInteractionRef.current[productId] = Date.now();
    timeoutRefs.current[productId] = setTimeout(() => {
      hideQuantityControls(productId);
    }, 3000);
  };

  // Thêm useEffect để kiểm tra thời gian không thao tác
  React.useEffect(() => {
    const checkInactivity = () => {
      const now = Date.now();
      Object.entries(showQuantityControls).forEach(([productId, isShowing]) => {
        if (isShowing && !isAdjustingRef.current[productId]) {
          const lastInteraction = lastInteractionRef.current[productId] || 0;
          if (now - lastInteraction > 3000) {
            hideQuantityControls(productId);
          }
        }
      });
    };

    const interval = setInterval(checkInactivity, 1000);
    return () => clearInterval(interval);
  }, [showQuantityControls]);

  const handleQuantityChangeComplete = (productId: string) => {
    if (quantityChangeTimeoutRef.current[productId]) {
      clearTimeout(quantityChangeTimeoutRef.current[productId]);
    }
    
    quantityChangeTimeoutRef.current[productId] = setTimeout(() => {
      if (Date.now() - lastQuantityChangeRef.current[productId] > 2000) {
        isAdjustingRef.current[productId] = false;
        hideQuantityControls(productId);
      }
    }, 2000);
  };

  const handleAddClick = (e: React.MouseEvent, productId: string, productName: string) => {
    e.stopPropagation();
    if (typeof addToCart === 'function') {
      setIsAnimating(prev => ({ ...prev, [productId]: true }));
      addToCart(productId, 1);
      setShowQuantityControls(prev => ({ ...prev, [productId]: true }));
      setShowMenuQuantityControls(prev => ({ ...prev, [productId]: true }));
      setIsAnimating(prev => ({ ...prev, [productId]: false }));
      isAdjustingRef.current[productId] = true;
      lastQuantityChangeRef.current[productId] = Date.now();
      handleQuantityChangeComplete(productId);
      toast.success(`Đã thêm ${productName} vào giỏ hàng`, {
        duration: 2000,
        position: 'bottom-right',
        style: {
          background: '#2563EB',
          color: '#fff',
          borderRadius: '0.5rem',
          padding: '0.5rem 1rem',
        },
      });
    }
  };

  const handleQuantityChange = async (orderLineId: string, newQuantity: number, productId: string) => {
    setIsAnimating(prev => ({ ...prev, [productId]: true }));
    await updateQuantity(orderLineId, newQuantity);
    setShowMenuQuantityControls(prev => ({ ...prev, [productId]: true }));
    setIsAnimating(prev => ({ ...prev, [productId]: false }));
    isAdjustingRef.current[productId] = true;
    lastQuantityChangeRef.current[productId] = Date.now();
    handleQuantityChangeComplete(productId);
  };

  const handleQuantityClick = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    setIsAnimating(prev => ({ ...prev, [productId]: true }));
    setShowQuantityControls(prev => ({ ...prev, [productId]: true }));
    setShowMenuQuantityControls(prev => ({ ...prev, [productId]: true }));
    setIsAnimating(prev => ({ ...prev, [productId]: false }));
    isAdjustingRef.current[productId] = true;
  };

  const handleClickOutside = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    isAdjustingRef.current[productId] = false;
    hideQuantityControls(productId);
  };

  // Thêm xử lý click ra ngoài
  React.useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isClickInsideControls = target.closest('[data-product-controls]');
      const isClickOnAdjustButton = target.closest('[data-adjust-button]');
      
      if (!isClickInsideControls && !isClickOnAdjustButton) {
        const productsWithControls = Object.entries(showQuantityControls)
          .filter(([_, value]) => value)
          .map(([key]) => key);

        productsWithControls.forEach(productId => {
          hideQuantityControls(productId);
        });
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [showQuantityControls]);

  const handleCustomizeClick = (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    router.push(`/product/${slug}`);
  };

  if (!collection) {
    return null;
  }

  const displayedProducts = showAllProducts 
    ? collection.productVariants?.items || [] 
    : (collection.productVariants?.items || []).slice(0, PRODUCTS_PER_PAGE);

  const hasMoreProducts = (collection.productVariants?.items || []).length > PRODUCTS_PER_PAGE;

  // Cleanup timeouts khi component unmount
  React.useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      Object.values(quantityChangeTimeoutRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  return (
    <div id={collection.id} data-collection-id={collection.id} className="py-4">
      <div className="container mx-auto px-2">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-bold mb-4 text-gray-800"
        >
          {collection.name || 'Danh mục'}
        </motion.h2>
        
        {collection.description && (
          <div 
            className="mb-4 text-gray-600 prose max-w-none"
            dangerouslySetInnerHTML={{ __html: formatDescription(collection.description) }}
          />
        )}

        {/* Mobile layout */}
        <div className="sm:hidden space-y-3">
          {displayedProducts.map((variant) => {
            const cartItem = cart?.lines?.find((line: CartLine) => line.productVariant.id === variant.id);
            return (
              <div key={variant.id} className="relative">
                <div 
                  className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100"
                  onClick={() => handleCardClick(variant.product?.slug || '')}
                >
                  <div className="pointer-events-auto">
                    <div className="flex h-full">
                      <div className="w-[140px] flex-shrink-0">
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-white p-1 flex items-center justify-center">
                          <VendureAsset
                            preview={variant.product?.featuredAsset?.preview}
                            source={variant.product?.featuredAsset?.source}
                            preset="medium"
                            alt={variant.product?.name || ''}
                            width={140}
                            height={140}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                      <div className="flex-grow p-3 flex flex-col">
                        <div className="flex-grow">
                          <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">{variant.name}</h3>
                          <p className="text-sm text-gray-500 mb-1 line-clamp-2">
                            {formatDescription(variant.product?.description || '')}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="font-medium text-blue-600">
                            {formatPrice(variant.priceWithTax, variant.currencyCode)}
                          </p>
                          <div className="flex items-center">
                            {cartItem ? (
                              showQuantityControls[variant.id] ? (
                                <div 
                                  className="flex items-center space-x-2 bg-white rounded-full shadow-sm border border-gray-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClickOutside(e, variant.id);
                                  }}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuantityChange(cartItem.id, cartItem.quantity - 1, variant.id);
                                    }}
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-50"
                                  >
                                    -
                                  </button>
                                  <span className="text-sm font-medium w-6 text-center">{cartItem.quantity}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuantityChange(cartItem.id, cartItem.quantity + 1, variant.id);
                                    }}
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-50"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => handleQuantityClick(e, variant.id)}
                                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-full hover:bg-blue-700"
                                >
                                  {cartItem.quantity}
                                </button>
                              )
                            ) : (
                              <button
                                onClick={(e) => handleAddClick(e, variant.id, variant.name)}
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-full hover:bg-blue-700"
                              >
                                Thêm
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop layout */}
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {displayedProducts.map((variant) => {
            const cartItem = cart?.lines?.find((line: CartLine) => line.productVariant.id === variant.id);
            return (
              <div key={variant.id} className="relative">
                <div 
                  className="group relative bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100"
                  onClick={() => handleCardClick(variant.product?.slug || '')}
                >
                  <div className="pointer-events-auto">
                    <div className="relative w-full aspect-square">
                      <ProductImage
                        preview={variant.product?.featuredAsset?.preview}
                        source={variant.product?.featuredAsset?.source}
                        alt={variant.product?.name || ''}
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{variant.product?.name}</h3>
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                        {formatDescription(variant.product?.description || '')}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-blue-600">
                          {formatPrice(variant.priceWithTax, variant.currencyCode)}
                        </p>
                        <AnimatePresence mode="wait">
                          {cartItem ? (
                            showQuantityControls[variant.id] ? (
                              <motion.div 
                                key="quantity-controls"
                                data-product-controls
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center space-x-2 bg-white rounded-full shadow-md"
                                onMouseEnter={() => {
                                  const productId = variant.id;
                                  isAdjustingRef.current[productId] = true;
                                }}
                                onMouseLeave={() => {
                                  isAdjustingRef.current[variant.id] = false;
                                  handleQuantityChangeComplete(variant.id);
                                }}
                              >
                                <button
                                  data-adjust-button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuantityChange(cartItem.id, cartItem.quantity - 1, variant.id);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200"
                                >
                                  -
                                </button>
                                <span className="text-sm font-medium">{cartItem.quantity}</span>
                                <button
                                  data-adjust-button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuantityChange(cartItem.id, cartItem.quantity + 1, variant.id);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200"
                                >
                                  +
                                </button>
                              </motion.div>
                            ) : (
                              <motion.div 
                                key="quantity-icon"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                onClick={(e) => handleQuantityClick(e, variant.id)}
                                className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors duration-200"
                              >
                                {cartItem.quantity}
                              </motion.div>
                            )
                          ) : (
                            <motion.button
                              key="add-button"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => handleAddClick(e, variant.id, variant.product?.name || '')}
                              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-300"
                            >
                              Thêm
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {hasMoreProducts && (
          <div className="mt-6 text-center">
            {!showAllProducts ? (
              <button
                onClick={() => setShowAllProducts(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Xem thêm
              </button>
            ) : (
              <button
                onClick={() => setShowAllProducts(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                Thu gọn
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}); 