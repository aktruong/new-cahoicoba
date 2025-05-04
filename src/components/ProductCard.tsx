import Image from 'next/image';

interface Product {
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

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="relative">
        <Image
          src={product.featuredAsset?.preview || '/placeholder.png'}
          alt={product.name}
          width={300}
          height={300}
          className="w-full h-48 object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
        <p className="text-gray-600">{product.description}</p>
        <div className="mt-4">
          <span className="text-xl font-bold text-blue-600">
            {product.priceWithTax.toLocaleString('vi-VN')}đ
          </span>
        </div>
      </div>
    </div>
  );
} 