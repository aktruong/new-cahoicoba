'use client';

import { VendureAsset } from './VendureAsset';

interface ProductImageProps {
  preview?: string;
  source?: string;
  alt: string;
  className?: string;
}

export function ProductImage({ preview, source, alt, className = '' }: ProductImageProps) {
  return (
    <div className="relative w-full aspect-square overflow-hidden bg-white p-1">
      {preview && source ? (
        <VendureAsset
          preview={preview}
          source={source}
          preset="medium"
          alt={alt}
          className={`absolute inset-0 w-full h-full object-contain ${className}`}
        />
      ) : (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400">Không có ảnh</span>
        </div>
      )}
    </div>
  );
} 