'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useCartContext } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import Link from 'next/link';
import { useCartDrawer } from '@/contexts/CartDrawerContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartDrawer() {
  const [isLoading, setIsLoading] = useState(false);
  const { cart, loading, error, removeFromCart, updateQuantity, loadCart } = useCartContext();
  const { isOpen, closeCartDrawer } = useCartDrawer();
  const router = useRouter();

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      loadCart().finally(() => {
        setIsLoading(false);
      });
    }
  }, [isOpen, loadCart]);

  const handleCheckout = () => {
    closeCartDrawer();
    router.push('/checkout');
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={closeCartDrawer}>
      <AnimatePresence>
        {isOpen && (
          <>
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'linear' }}
                  className="fixed inset-0 z-[100]"
                />
              </Dialog.Overlay>
              <Dialog.Content asChild>
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ 
                    type: 'tween',
                    duration: 0.3,
                    ease: 'linear'
                  }}
                  className="fixed inset-0 overflow-hidden z-[100]"
                >
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                      <div className="pointer-events-auto w-screen max-w-md">
                        <div className="flex h-full flex-col bg-white shadow-2xl">
                          <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
                            <div className="flex items-center justify-between px-4 py-4">
                              <Dialog.Title className="text-lg font-medium text-gray-900">
                                Giỏ hàng
                              </Dialog.Title>
                              <div className="ml-3 flex h-7 items-center">
                                <Dialog.Close className="relative -m-2 p-2 text-gray-400 hover:text-gray-500">
                                  <span className="absolute -inset-0.5" />
                                  <span className="sr-only">Đóng</span>
                                  <X className="h-6 w-6" aria-hidden="true" />
                                </Dialog.Close>
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                            {isLoading ? (
                              <div className="flex justify-center py-8">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
                              </div>
                            ) : error ? (
                              <div className="text-center text-red-500 py-4">{error}</div>
                            ) : cart?.lines.length ? (
                              <div className="flow-root">
                                <ul role="list" className="-my-6 divide-y divide-gray-200">
                                  {cart.lines.map((line) => (
                                    <li key={line.id} className="flex py-6">
                                      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                        <img
                                          src={line.productVariant.product.featuredAsset?.preview || '/placeholder.png'}
                                          alt={line.productVariant.name}
                                          className="h-full w-full object-cover object-center"
                                        />
                                      </div>

                                      <div className="ml-4 flex flex-1 flex-col">
                                        <div>
                                          <div className="flex justify-between text-base font-medium text-gray-900">
                                            <h3>
                                              <Link href={`/product/${line.productVariant.product.slug}`}>
                                                {line.productVariant.name}
                                              </Link>
                                            </h3>
                                            <p className="ml-4">
                                              {formatPrice(line.productVariant.priceWithTax)}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex flex-1 items-end justify-between text-sm">
                                          <div className="flex items-center space-x-3">
                                            <button
                                              onClick={() => updateQuantity(line.id, line.quantity - 1)}
                                              className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                            >
                                              -
                                            </button>
                                            <span className="text-gray-500 w-6 text-center">{line.quantity}</span>
                                            <button
                                              onClick={() => updateQuantity(line.id, line.quantity + 1)}
                                              className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                            >
                                              +
                                            </button>
                                          </div>

                                          <button
                                            type="button"
                                            className="font-medium text-primary hover:text-primary/80"
                                            onClick={() => removeFromCart(line.id)}
                                          >
                                            Xóa
                                          </button>
                                        </div>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <p className="text-gray-500">Giỏ hàng trống</p>
                              </div>
                            )}
                          </div>

                          {cart?.lines.length ? (
                            <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                              <div className="flex justify-between text-base font-medium text-gray-900">
                                <p>Tổng cộng</p>
                                <p>
                                  {formatPrice(
                                    cart.lines.reduce(
                                      (total, line) => total + (line.productVariant.priceWithTax * line.quantity),
                                      0
                                    )
                                  )}
                                </p>
                              </div>
                              <p className="mt-0.5 text-sm text-gray-500">
                                Phí vận chuyển sẽ được tính khi thanh toán
                              </p>
                              <div className="mt-6">
                                <button
                                  onClick={handleCheckout}
                                  className="flex w-full items-center justify-center rounded-md border border-transparent bg-[#1877F2] px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-[#1877F2]/90"
                                >
                                  Đặt hàng
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          </>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
} 