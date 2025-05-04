'use client';

import { useCartContext } from '@/contexts/CartContext';
import { useState, useEffect } from 'react';
import { formatPrice } from '@/lib/utils';
import { SimpleQuantityAdjuster } from '@/components/SimpleQuantityAdjuster';
import { useRouter } from 'next/navigation';

interface ProductContentProps {
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
}

export function ProductContent({ product }: ProductContentProps) {
  const router = useRouter();
  const { addToCart } = useCartContext();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
  };

  const handleAddToCart = async (variantId: string) => {
    const variant = product.variants.find(v => v.id === variantId);
    if (!variant) {
      console.error('Không tìm thấy biến thể sản phẩm');
      return;
    }

    const selectedAsset = variant.featuredAsset || product.featuredAsset;
    if (!selectedAsset) {
      console.error('Không tìm thấy hình ảnh sản phẩm');
      return;
    }

    const cartItem = {
      id: variantId,
      quantity: quantity,
      productVariant: {
        id: variantId,
        name: variant.name,
        priceWithTax: variant.priceWithTax,
        currencyCode: variant.currencyCode,
        featuredAsset: selectedAsset
      }
    };

    console.log('Adding to cart:', cartItem);
    await addToCart(variantId, quantity);
    router.push('/');
  };

  return (
    <div className="container mx-auto px-4 py-4 pb-24 md:pb-4">
      {/* Product Image */}
      <div className="mb-6">
        <img
          src={product.featuredAsset?.preview || '/placeholder.png'}
          alt={product.name}
          className="w-full h-auto rounded-lg shadow-md"
        />
      </div>

      {/* Product Info */}
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <div className="mt-2">
            <p className="text-lg font-semibold text-blue-600">
              {formatPrice(selectedVariant.priceWithTax, selectedVariant.currencyCode)}
            </p>
          </div>
        </div>

        {/* Description */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Mô tả sản phẩm</h2>
          <div 
            className="text-gray-600 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>

        {/* Variants - Desktop */}
        <div className="hidden md:block">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Lựa chọn</h2>
          <div className="space-y-3">
            {product.variants.map((variant) => (
              <div 
                key={variant.id} 
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedVariant.id === variant.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => setSelectedVariant(variant)}
              >
                <div>
                  <p className="font-medium text-gray-900">{variant.name}</p>
                  <p className="text-sm text-gray-600">
                    {formatPrice(variant.priceWithTax, variant.currencyCode)}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <SimpleQuantityAdjuster
                    quantity={quantity}
                    onQuantityChange={handleQuantityChange}
                  />
                  <button
                    onClick={() => handleAddToCart(variant.id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Thêm
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Variants - Mobile */}
        <div className="md:hidden">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Lựa chọn</h2>
          <div className="space-y-2">
            {product.variants.map((variant) => (
              <div 
                key={variant.id} 
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedVariant.id === variant.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => setSelectedVariant(variant)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{variant.name}</p>
                    <p className="text-sm text-gray-600">
                      {formatPrice(variant.priceWithTax, variant.currencyCode)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile sticky add to cart button */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-lg md:hidden">
          <div className="flex items-center justify-between">
            <SimpleQuantityAdjuster
              quantity={quantity}
              onQuantityChange={handleQuantityChange}
            />
            <button
              onClick={() => handleAddToCart(selectedVariant.id)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex-1 ml-3"
            >
              Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 