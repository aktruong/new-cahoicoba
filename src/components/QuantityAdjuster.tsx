import { motion } from 'framer-motion';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface QuantityAdjusterProps {
  quantity: number;
  onQuantityChange: (newQuantity: number) => void;
  productName: string;
}

export function QuantityAdjuster({ quantity, onQuantityChange, productName }: QuantityAdjusterProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    onQuantityChange(newQuantity);
    if (newQuantity > quantity) {
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
    } else {
      toast.success(`Đã giảm số lượng ${productName}`, {
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

  if (!isHovered && quantity > 0) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        onHoverStart={() => setIsHovered(true)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white cursor-pointer"
      >
        <span className="text-sm font-medium">{quantity}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      onHoverEnd={() => setIsHovered(false)}
      className="flex items-center gap-1 bg-blue-600 text-white rounded-md px-2 py-1"
    >
      <button
        onClick={() => handleQuantityChange(quantity - 1)}
        className="p-1 hover:bg-blue-700 rounded"
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="text-sm font-medium min-w-[20px] text-center">{quantity}</span>
      <button
        onClick={() => handleQuantityChange(quantity + 1)}
        className="p-1 hover:bg-blue-700 rounded"
      >
        <Plus className="w-3 h-3" />
      </button>
    </motion.div>
  );
} 