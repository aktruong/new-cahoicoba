import React, { useState, useEffect } from 'react';

interface Promotion {
  id: string;
  name: string;
  description: string;
  amount: number;
  code: string;
}

export function PromotionSelector() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(process.env.NEXT_PUBLIC_SHOP_API_URL!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'vendure-token': process.env.NEXT_PUBLIC_VENDURE_TOKEN!,
          },
          body: JSON.stringify({
            query: `
              query GetActiveOrder {
                activeOrder {
                  id
                  discounts {
                    adjustmentSource
                    description
                    amount
                    amountWithTax
                  }
                }
              }
            `,
          }),
        });

        const result = await response.json();
        if (result.errors) {
          throw new Error(result.errors[0].message);
        }

        const orderPromotions = result.data.activeOrder?.discounts?.map((discount: any) => ({
          id: discount.adjustmentSource,
          name: discount.description,
          description: discount.description,
          amount: discount.amountWithTax,
          code: discount.adjustmentSource,
        })) || [];

        setPromotions(orderPromotions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi không xác định');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="text-center py-4">Đang tải khuyến mãi...</div>;

  return (
    <div className="promotion-selector bg-white rounded-lg shadow-sm p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3">Mã khuyến mãi đã áp dụng</h3>
      
      {error && (
        <div className="text-red-500 text-sm mb-4">{error}</div>
      )}

      <div className="space-y-3">
        {promotions.map((promotion) => (
          <div 
            key={promotion.id}
            className="promotion-item p-3 border border-gray-200 rounded-lg"
          >
            <div className="flex justify-between items-start">
              <div>
                <h5 className="font-medium text-gray-900">{promotion.name}</h5>
                <p className="text-sm text-gray-600 mt-1">{promotion.description}</p>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Giảm giá: {promotion.amount.toLocaleString('vi-VN')}đ
            </div>
          </div>
        ))}
        {promotions.length === 0 && (
          <div className="text-center py-4">
            <p className="text-gray-500">Chưa có mã khuyến mãi nào được áp dụng</p>
          </div>
        )}
      </div>
    </div>
  );
} 