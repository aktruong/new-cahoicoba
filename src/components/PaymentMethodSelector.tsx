import React from 'react';

interface PaymentMethodSelectorProps {
  onPaymentMethodChange: (method: string) => void;
}

export function PaymentMethodSelector({ onPaymentMethodChange }: PaymentMethodSelectorProps) {
  const paymentMethods = [
    { id: 'cash', name: 'Thanh toán khi nhận hàng (COD)' },
    { id: 'bank_transfer', name: 'Chuyển khoản ngân hàng' },
  ];

  return (
    <div className="space-y-4">
      {paymentMethods.map((method) => (
        <div key={method.id} className="flex items-center">
          <input
            type="radio"
            id={method.id}
            name="paymentMethod"
            value={method.id}
            onChange={(e) => onPaymentMethodChange(e.target.value)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
          />
          <label htmlFor={method.id} className="ml-3 block text-sm font-medium text-gray-700">
            {method.name}
          </label>
        </div>
      ))}
    </div>
  );
} 