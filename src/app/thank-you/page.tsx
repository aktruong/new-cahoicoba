'use client';

import { useEffect, useState } from 'react';

export default function ThankYouPage() {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Hiển thị thông báo trước
    console.log('Hiển thị trang cảm ơn');
    
    // Xóa cookies sau 2 giây
    const clearCookies = setTimeout(() => {
      console.log('Bắt đầu xóa cookies');
      document.cookie = 'session=; Max-Age=0; path=/';
      document.cookie = 'vendure-token=; Max-Age=0; path=/';
      console.log('Đã xóa cookies');
    }, 2000);
    
    // Đếm ngược
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Chuyển về trang chủ sau 10 giây
    const redirectTimer = setTimeout(() => {
      console.log('Chuyển hướng về trang chủ');
      window.location.href = '/';
    }, 10000);

    return () => {
      clearTimeout(clearCookies);
      clearTimeout(redirectTimer);
      clearInterval(countdownInterval);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg animate-fade-in">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Cảm ơn bạn đã đặt hàng!</h2>
          <p className="mt-4 text-gray-600">
            Đơn hàng của bạn đã được xử lý thành công. Chúng tôi sẽ liên hệ với bạn sớm nhất có thể.
          </p>
          <div className="mt-6">
            <p className="text-sm text-gray-500">
              Bạn sẽ được chuyển về trang chủ trong {countdown} giây...
            </p>
            <div className="mt-4">
              <button
                onClick={() => window.location.href = '/'}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Quay về trang chủ ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 