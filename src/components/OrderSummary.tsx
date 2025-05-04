import React from 'react';
import { formatPrice } from '@/lib/utils';

interface OrderSummaryProps {
  order: any;
}

export function OrderSummary({ order }: OrderSummaryProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Tóm tắt đơn hàng</h3>
      
      <div className="space-y-4">
        <div className="flex justify-between">
          <span>Tạm tính:</span>
          <span>{formatPrice(order?.subTotal || 0)}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Phí vận chuyển:</span>
          <span>{formatPrice(order?.shipping || 0)}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Thuế:</span>
          <span>{formatPrice(order?.taxTotal || 0)}</span>
        </div>
        
        <div className="border-t pt-4">
          <div className="flex justify-between font-semibold text-lg">
            <span>Tổng cộng:</span>
            <span>{formatPrice(order?.total || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 