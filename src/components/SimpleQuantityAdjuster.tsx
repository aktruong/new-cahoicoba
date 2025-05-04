import React from 'react';

interface SimpleQuantityAdjusterProps {
  quantity: number;
  onQuantityChange: (newQuantity: number) => void;
  min?: number;
  max?: number;
}

export const SimpleQuantityAdjuster: React.FC<SimpleQuantityAdjusterProps> = ({
  quantity,
  onQuantityChange,
  min = 1,
  max = 999,
}) => {
  const handleDecrease = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  return (
    <div className="flex items-center border rounded">
      <button
        onClick={handleDecrease}
        className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={quantity <= min}
      >
        -
      </button>
      <span className="px-3 py-1">{quantity}</span>
      <button
        onClick={handleIncrease}
        className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={quantity >= max}
      >
        +
      </button>
    </div>
  );
}; 