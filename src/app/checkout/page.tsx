'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/utils';
import AddressInput from '@/components/AddressInput';
import { FormProvider } from '@/contexts/FormContext';

// Thêm CSS tùy chỉnh
const customStyles = `
  .time-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    background-color: #f3f4f6;
    text-align: center;
    font-size: 1rem;
    color: #374151;
  }
  .time-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
  .time-input::-webkit-calendar-picker-indicator {
    background: none;
    display: none;
  }
  .date-time-container {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  .date-time-container input {
    flex: 1;
  }
  .time-container {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .time-label {
    white-space: nowrap;
    font-size: 1rem;
    color: #374151;
  }
  .phone-input {
    color: #374151;
  }
  .phone-input.invalid {
    color: #ef4444;
  }
`;

interface FormData {
  fullName: string;
  phoneNumber: string;
  address: string;
  company: string;
  city: string;
  district: string;
  ward: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, loadCart } = useCart();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState<any>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryTime, setDeliveryTime] = useState<'now' | 'today' | 'custom'>('now');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState('');
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phoneNumber: '',
    address: '',
    company: '',
    city: '',
    district: '',
    ward: ''
  });
  const [storeAddress, setStoreAddress] = useState<any>(null);

  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load cart nếu chưa có
        if (!cart?.id) {
          await loadCart();
          
          if (!cart?.id) {
            setError('Không tìm thấy giỏ hàng. Vui lòng thêm sản phẩm vào giỏ hàng.');
            setLoading(false);
            return;
          }
        }

        // Kiểm tra xem cart có items không
        if (!cart.lines || cart.lines.length === 0) {
          setError('Giỏ hàng trống. Vui lòng thêm sản phẩm vào giỏ hàng.');
          setLoading(false);
          return;
        }

        // Kiểm tra trạng thái của order
        const response = await fetch(process.env.NEXT_PUBLIC_SHOP_API_URL!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'vendure-token': process.env.NEXT_PUBLIC_VENDURE_TOKEN || ''
          },
          credentials: 'include',
          body: JSON.stringify({
            query: `
              query GetActiveOrder {
                activeOrder {
                  id
                  code
                  state
                  total
                  totalWithTax
                  lines {
                    id
                    quantity
                    productVariant {
                      id
                      name
                      sku
                      price
                      priceWithTax
                    }
                  }
                  shippingAddress {
                    fullName
                    streetLine1
                    streetLine2
                    city
                    province
                    postalCode
                    country
                    phoneNumber
                  }
                }
              }
            `
          }),
        });

        const result = await response.json();

        if (result.errors) {
          throw new Error(result.errors[0].message);
        }

        if (!result.data?.activeOrder) {
          setError('Không tìm thấy đơn hàng. Vui lòng thêm sản phẩm vào giỏ hàng.');
          setLoading(false);
          return;
        }

        // Nếu order đã ở trạng thái ArrangingPayment hoặc cao hơn, tạo order mới
        if (result.data.activeOrder.state === 'ArrangingPayment') {
          await loadCart(); // Tạo cart mới
          setError('Đơn hàng đã được xử lý. Vui lòng tạo đơn hàng mới.');
          setLoading(false);
          return;
        }

        // Set order và địa chỉ
        const activeOrder = result.data.activeOrder;
        setOrder(activeOrder);
        
        if (activeOrder.shippingAddress) {
          setShippingAddress(activeOrder.shippingAddress);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi không xác định');
        console.error('Error initializing checkout:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeCheckout();
  }, [cart?.id, loadCart, router]);

  // Thêm hàm lấy địa chỉ cửa hàng
  const fetchStoreAddress = async () => {
    try {
      const result = await fetch(process.env.NEXT_PUBLIC_SHOP_API_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'vendure-token': process.env.NEXT_PUBLIC_VENDURE_TOKEN || ''
        },
        credentials: 'include',
        body: JSON.stringify({
          query: `
            query {
              activeChannel {
                id
                code
                token
                customFields {
                  storeAddress
                }
              }
            }
          `
        })
      });

      const response = await result.json();
      
      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      if (response.data?.activeChannel?.customFields?.storeAddress) {
        setStoreAddress(response.data.activeChannel.customFields.storeAddress);
      }
    } catch (err) {
      console.error('Lỗi khi lấy địa chỉ cửa hàng:', err);
    }
  };

  // Thêm useEffect để lấy địa chỉ cửa hàng khi component mount
  useEffect(() => {
    fetchStoreAddress();
  }, []);

  const setCustomerForOrder = async (fullName: string, phoneNumber: string) => {
    try {
      // Xử lý tên
      const nameParts = fullName.trim().split(' ');
      let firstName, lastName;
      
      if (nameParts.length === 1) {
        firstName = "Anh/chị";
        lastName = nameParts[0];
      } else {
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      }

      // Xử lý số điện thoại - chỉ lấy số
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      
      // Tạo email từ số điện thoại đã xử lý
      const email = `${cleanPhoneNumber}@cahoicoba.com`;

      console.log('Thông tin khách hàng:', {
        fullName,
        phoneNumber,
        cleanPhoneNumber,
        firstName,
        lastName,
        email
      });

      if (!process.env.NEXT_PUBLIC_SHOP_API_URL) {
        throw new Error('NEXT_PUBLIC_SHOP_API_URL is not defined');
      }

      if (!process.env.NEXT_PUBLIC_VENDURE_TOKEN) {
        throw new Error('NEXT_PUBLIC_VENDURE_TOKEN is not defined');
      }

      const response = await fetch(process.env.NEXT_PUBLIC_SHOP_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'vendure-token': process.env.NEXT_PUBLIC_VENDURE_TOKEN
        },
        credentials: 'include',
        body: JSON.stringify({
          query: `
            mutation SetCustomerForOrder($input: CreateCustomerInput!) {
              setCustomerForOrder(input: $input) {
                ... on Order {
                  id
                  code
                  state
                  customer {
                    id
                    firstName
                    lastName
                    emailAddress
                    phoneNumber
                  }
                }
                ... on ErrorResult {
                  errorCode
                  message
                }
              }
            }
          `,
          variables: {
            input: {
              firstName,
              lastName,
              emailAddress: email,
              phoneNumber: cleanPhoneNumber
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      console.log('Kết quả setCustomerForOrder:', result.data.setCustomerForOrder);

      // Kiểm tra nếu có lỗi từ mutation
      if (result.data?.setCustomerForOrder?.__typename === 'ErrorResult') {
        throw new Error(result.data.setCustomerForOrder.message);
      }

      return result.data.setCustomerForOrder;
    } catch (error) {
      console.error('Lỗi khi setCustomerForOrder:', error);
      throw error;
    }
  };

  const handleCustomerInfoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);

    // Chỉ gọi mutation khi:
    // 1. Đang nhập số điện thoại và đã đủ 10 số
    // 2. Hoặc đang nhập tên và số điện thoại đã có đủ 10 số
    if (
      (name === 'phoneNumber' && value.replace(/\D/g, '').length === 10 && newFormData.fullName) ||
      (name === 'fullName' && newFormData.phoneNumber.replace(/\D/g, '').length === 10)
    ) {
      await setCustomerForOrder(
        name === 'fullName' ? value : newFormData.fullName,
        name === 'phoneNumber' ? value : newFormData.phoneNumber
      );
    }
  };

  // Thêm hàm xử lý khi thay đổi phương thức giao hàng
  const handleDeliveryMethodChange = async (method: 'delivery' | 'pickup') => {
    setDeliveryMethod(method);
    
    if (method === 'pickup' && storeAddress) {
      try {
        // Lấy danh sách shipping methods trước
        const shippingMethodsResult = await fetch(process.env.NEXT_PUBLIC_SHOP_API_URL!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'vendure-token': process.env.NEXT_PUBLIC_VENDURE_TOKEN || ''
          },
          credentials: 'include',
          body: JSON.stringify({
            query: `
              query {
                eligibleShippingMethods {
                  id
                  code
                  name
                  description
                  price
                  priceWithTax
                }
              }
            `
          })
        });

        const shippingMethodsResponse = await shippingMethodsResult.json();
        
        if (shippingMethodsResponse.errors) {
          throw new Error(shippingMethodsResponse.errors[0].message);
        }

        // Tìm phương thức 'nhan-tai-cua-hang'
        if (shippingMethodsResponse.data?.eligibleShippingMethods) {
          const pickupMethod = shippingMethodsResponse.data.eligibleShippingMethods.find(
            (method: any) => method.code === 'nhan-tai-cua-hang'
          );

          if (pickupMethod) {
            console.log('Đang set shipping method:', pickupMethod);
            // Set shipping method trước
            const setShippingResult = await fetch(process.env.NEXT_PUBLIC_SHOP_API_URL!, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'vendure-token': process.env.NEXT_PUBLIC_VENDURE_TOKEN || ''
              },
              credentials: 'include',
              body: JSON.stringify({
                query: `
                  mutation SetShippingMethod($shippingMethodId: [ID!]!) {
                    setOrderShippingMethod(shippingMethodId: $shippingMethodId) {
                      ... on Order {
                        id
                        code
                        state
                        total
                        totalWithTax
                        shipping
                        shippingWithTax
                      }
                      ... on ErrorResult {
                        errorCode
                        message
                      }
                    }
                  }
                `,
                variables: {
                  shippingMethodId: [pickupMethod.id]
                }
              })
            });

            const setShippingResponse = await setShippingResult.json();
            
            if (setShippingResponse.errors) {
              throw new Error(setShippingResponse.errors[0].message);
            }

            if (setShippingResponse.data?.setOrderShippingMethod) {
              console.log('Kết quả set shipping method:', setShippingResponse.data.setOrderShippingMethod);
              
              // Cập nhật order với thông tin mới
              setOrder((prevOrder: any) => ({
                ...prevOrder,
                ...setShippingResponse.data.setOrderShippingMethod
              }));
              
              // Phân tách địa chỉ cửa hàng thành các phần
              const addressParts = storeAddress.split(', ');
              const streetAndNumber = addressParts[0];
              const ward = addressParts[1];
              const district = addressParts[2];
              const city = addressParts[3];

              // Tạo địa chỉ gửi hàng từ địa chỉ cửa hàng
              const shippingAddress = {
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber,
                streetLine1: `${streetAndNumber}, ${ward}, ${district}`.trim(),
                streetLine2: '',
                city: city,
                province: city,
                postalCode: '',
                countryCode: 'VN',
                company: ''
              };

              // Log dữ liệu địa chỉ trước khi gửi
              console.log('=== Dữ liệu địa chỉ cửa hàng chuẩn bị gửi về backend ===');
              console.log('1. Thông tin khách hàng:');
              console.log('- Họ tên:', shippingAddress.fullName);
              console.log('- Số điện thoại:', shippingAddress.phoneNumber);
              console.log('2. Thông tin địa chỉ:');
              console.log('- Địa chỉ cửa hàng:', shippingAddress.streetLine1);
              console.log('- Thành phố:', shippingAddress.city);
              console.log('- Mã bưu điện:', shippingAddress.postalCode);
              console.log('- Mã quốc gia:', shippingAddress.countryCode);
              console.log('3. Địa chỉ đầy đủ:', shippingAddress);
              console.log('=============================================');

              // Set địa chỉ
              const addressResult = await fetch(process.env.NEXT_PUBLIC_SHOP_API_URL!, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'vendure-token': process.env.NEXT_PUBLIC_VENDURE_TOKEN || ''
                },
                credentials: 'include',
                body: JSON.stringify({
                  query: `
                    mutation SetOrderShippingAddress($input: CreateAddressInput!) {
                      setOrderShippingAddress(input: $input) {
                        ... on Order {
                          id
                          shippingAddress {
                            fullName
                            streetLine1
                            streetLine2
                            city
                            province
                            postalCode
                            phoneNumber
                            company
                          }
                        }
                        ... on ErrorResult {
                          errorCode
                          message
                        }
                      }
                    }
                  `,
                  variables: {
                    input: shippingAddress
                  }
                })
              });

              const addressResponse = await addressResult.json();
              
              if (addressResponse.errors) {
                throw new Error(addressResponse.errors[0].message);
              }

              if (addressResponse.data?.setOrderShippingAddress) {
                // Cập nhật formData sau khi API thành công
                setFormData(prev => ({
                  ...prev,
                  address: `${streetAndNumber}, ${ward}, ${district}`
                }));
                
                setShippingAddress(addressResponse.data.setOrderShippingAddress.shippingAddress);
                setError(null);
              }
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi khi cập nhật địa chỉ cửa hàng');
        console.error('Error setting store address:', err);
      }
    } else if (method === 'delivery') {
      // Reset shipping methods và selected shipping method
      setShippingMethods([]);
      setSelectedShippingMethod(null);
      
      // Nếu có địa chỉ, lấy lại shipping methods
      if (formData.address && formData.city && formData.district) {
        await fetchShippingMethods();
      }
    }
  };

  // Thêm hàm xử lý địa chỉ
  const handleAddressSelect = async (address: any) => {
    try {
      // Tạo địa chỉ gửi hàng từ dữ liệu nhận được
      const shippingAddress = {
        fullName: address.fullName || formData.fullName,
        phoneNumber: address.phoneNumber || formData.phoneNumber,
        streetLine1: address.streetLine1 || '',
        streetLine2: address.streetLine2 || '',
        city: address.city || '',
        province: address.province || address.city || '',
        postalCode: address.postalCode || '',
        countryCode: address.countryCode || 'VN',
        company: address.company || ''
      };

      // Log dữ liệu địa chỉ trước khi gửi
      console.log('=== Dữ liệu địa chỉ chuẩn bị gửi về backend ===');
      console.log('1. Thông tin khách hàng:');
      console.log('- Họ tên:', shippingAddress.fullName);
      console.log('- Số điện thoại:', shippingAddress.phoneNumber);
      console.log('2. Thông tin địa chỉ:');
      console.log('- Địa chỉ:', shippingAddress.streetLine1);
      console.log('- Thành phố:', shippingAddress.city);
      console.log('- Mã bưu điện:', shippingAddress.postalCode);
      console.log('- Mã quốc gia:', shippingAddress.countryCode);
      console.log('- Chi tiết địa chỉ:', shippingAddress.company);
      console.log('3. Địa chỉ đầy đủ:', shippingAddress);
      console.log('=============================================');

      const result = await fetch(process.env.NEXT_PUBLIC_SHOP_API_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'vendure-token': process.env.NEXT_PUBLIC_VENDURE_TOKEN || ''
        },
        credentials: 'include',
        body: JSON.stringify({
          query: `
            mutation SetOrderShippingAddress($input: CreateAddressInput!) {
              setOrderShippingAddress(input: $input) {
                ... on Order {
                  id
                  shippingAddress {
                    fullName
                    streetLine1
                    streetLine2
                    city
                    province
                    postalCode
                    phoneNumber
                    company
                  }
                }
                ... on ErrorResult {
                  errorCode
                  message
                }
              }
            }
          `,
          variables: {
            input: shippingAddress
          }
        })
      });

      const response = await result.json();
      
      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      if (response.data?.setOrderShippingAddress) {
        // Cập nhật formData sau khi API thành công
        setFormData(prev => ({
          ...prev,
          fullName: shippingAddress.fullName,
          phoneNumber: shippingAddress.phoneNumber,
          address: shippingAddress.streetLine1,
          company: shippingAddress.company,
          city: shippingAddress.city,
          district: shippingAddress.province,
          ward: shippingAddress.streetLine2 || 'Phường 5' // Thêm giá trị mặc định cho ward
        }));
        
        setShippingAddress(response.data.setOrderShippingAddress.shippingAddress);
        setError(null);

        // Gọi fetchShippingMethods ngay sau khi cập nhật địa chỉ
        await fetchShippingMethods();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi cập nhật địa chỉ');
      console.error('Error setting shipping address:', err);
    }
  };

  // Thêm hàm lấy shipping methods
  const fetchShippingMethods = useCallback(async () => {
    try {
      console.log('Đang lấy shipping methods...');
      const result = await fetch(process.env.NEXT_PUBLIC_SHOP_API_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'vendure-token': process.env.NEXT_PUBLIC_VENDURE_TOKEN || ''
        },
        credentials: 'include',
        body: JSON.stringify({
          query: `
            query {
              eligibleShippingMethods {
                id
                code
                name
                description
                price
                priceWithTax
              }
            }
          `
        })
      });

      const response = await result.json();
      
      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      console.log('Shipping methods nhận được:', response.data?.eligibleShippingMethods);

      if (response.data?.eligibleShippingMethods) {
        // Lọc bỏ phương thức 'nhan-tai-cua-hang'
        const filteredMethods = response.data.eligibleShippingMethods.filter(
          (method: any) => method.code !== 'nhan-tai-cua-hang'
        );
        setShippingMethods(filteredMethods);
        
        // Chọn phương thức đầu tiên làm mặc định
        if (filteredMethods.length > 0) {
          const firstMethod = filteredMethods[0];
          setSelectedShippingMethod(firstMethod);
          
          // Tự động set shipping method cho order
          await handleShippingMethodSelect(firstMethod.id);
        }
      }
    } catch (err) {
      console.error('Lỗi khi lấy shipping methods:', err);
    }
  }, []);

  // Thêm useEffect để lấy shipping methods khi có địa chỉ
  useEffect(() => {
    const { address, city, district, ward } = formData;
    console.log('Địa chỉ hiện tại:', { address, city, district, ward });
    if (deliveryMethod === 'delivery' && address && city && district && ward) {
      console.log('Có địa chỉ, đang lấy shipping methods...');
      fetchShippingMethods();
    }
  }, [formData.address, formData.city, formData.district, formData.ward, deliveryMethod, fetchShippingMethods]);

  // Thêm hàm kiểm tra order
  const checkOrder = async () => {
    try {
      console.log('Đang kiểm tra order...');
      const result = await fetch(process.env.NEXT_PUBLIC_SHOP_API_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'vendure-token': process.env.NEXT_PUBLIC_VENDURE_TOKEN || ''
        },
        credentials: 'include',
        body: JSON.stringify({
          query: `
            query {
              activeOrder {
                id
                code
                state
                total
                totalWithTax
                lines {
                  id
                  quantity
                  productVariant {
                    id
                    name
                    sku
                    price
                    priceWithTax
                  }
                }
              }
            }
          `
        })
      });

      const response = await result.json();
      
      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      console.log('Order hiện tại:', response.data?.activeOrder);

      if (!response.data?.activeOrder) {
        throw new Error('Không tìm thấy order');
      }

      return response.data.activeOrder;
    } catch (err) {
      console.error('Lỗi khi kiểm tra order:', err);
      throw err;
    }
  };

  // Thêm hàm xử lý khi chọn shipping method
  const handleShippingMethodSelect = async (methodId: string) => {
    try {
      const selectedMethod = shippingMethods.find(m => m.id === methodId);
      if (!selectedMethod) return;

      console.log('Đang chọn shipping method:', selectedMethod);

      // Kiểm tra order trước
      const currentOrder = await checkOrder();
      if (!currentOrder) {
        throw new Error('Không tìm thấy order');
      }

      setSelectedShippingMethod(selectedMethod);

      const result = await fetch(process.env.NEXT_PUBLIC_SHOP_API_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'vendure-token': process.env.NEXT_PUBLIC_VENDURE_TOKEN || ''
        },
        credentials: 'include',
        body: JSON.stringify({
          query: `
            mutation SetShippingMethod($shippingMethodId: [ID!]!) {
              setOrderShippingMethod(shippingMethodId: $shippingMethodId) {
                ... on Order {
                  id
                  code
                  state
                  total
                  totalWithTax
                  shipping
                  shippingWithTax
                  lines {
                    id
                    quantity
                    productVariant {
                      id
                      name
                      sku
                      price
                      priceWithTax
                    }
                  }
                }
                ... on ErrorResult {
                  errorCode
                  message
                }
              }
            }
          `,
          variables: {
            shippingMethodId: [methodId]
          }
        })
      });

      const response = await result.json();
      
      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      console.log('Kết quả set shipping method:', response.data?.setOrderShippingMethod);

      if (response.data?.setOrderShippingMethod) {
        // Cập nhật order với phí ship mới nhưng giữ nguyên tất cả thông tin khác
        const updatedOrder = {
          ...order,
          ...response.data.setOrderShippingMethod,
          lines: order.lines // Giữ nguyên lines từ order cũ
        };
        setOrder(updatedOrder);
      }
    } catch (err) {
      console.error('Lỗi khi chọn shipping method:', err);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Đang tải...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return <div className="container mx-auto px-4 py-8">Không tìm thấy đơn hàng</div>;
  }

  return (
    <FormProvider>
      <style>{customStyles}</style>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            {/* Thông tin khách hàng */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Thông tin khách hàng</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleCustomerInfoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleCustomerInfoChange}
                    pattern="[0-9]{10}"
                    maxLength={10}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent phone-input ${
                      formData.phoneNumber.length > 0 && formData.phoneNumber.length < 10 ? 'invalid' : ''
                    }`}
                    placeholder="Nhập số điện thoại"
                    required
                  />
                </div>

                {/* Phương thức giao hàng */}
                <div>
                  <label htmlFor="deliveryMethod" className="block text-sm font-medium text-gray-700 mb-1">
                    Phương thức giao hàng
                  </label>
                  <select
                    id="deliveryMethod"
                    value={deliveryMethod}
                    onChange={(e) => handleDeliveryMethodChange(e.target.value as 'delivery' | 'pickup')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="delivery">Giao hàng tận nơi</option>
                    <option value="pickup">Nhận tại cửa hàng</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Hiển thị địa chỉ cửa hàng khi chọn pickup */}
            {deliveryMethod === 'pickup' && storeAddress && (
              <div className="mb-8 bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">Địa chỉ cửa hàng</h3>
                <p className="text-gray-700">{storeAddress}</p>
              </div>
            )}

            {/* Form địa chỉ giao hàng */}
            {deliveryMethod === 'delivery' && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Địa chỉ giao hàng</h2>
                <AddressInput
                  onAddressSelect={handleAddressSelect}
                  initialAddress={shippingAddress}
                />
              </div>
            )}

            {/* Thời gian giao hàng */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Thời gian giao hàng</h2>
              <select
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value as 'now' | 'today' | 'custom')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="now">Giao ngay</option>
                <option value="today">Giao trong hôm nay</option>
                <option value="custom">Chọn ngày và giờ</option>
              </select>

              {deliveryTime === 'today' && (
                <div className="mt-4">
                  <div className="time-container">
                    <span className="time-label">Chọn giờ giao:</span>
                    <input
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      min="10:00"
                      max="21:00"
                      className="time-input"
                    />
                  </div>
                </div>
              )}

              {deliveryTime === 'custom' && (
                <div className="mt-4">
                  <div className="date-time-container">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="time-input"
                    />
                    <input
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      min="10:00"
                      max="21:00"
                      className="time-input"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Phương thức vận chuyển */}
            {deliveryMethod === 'delivery' && formData.address && formData.city && formData.district && shippingMethods.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Phương thức vận chuyển</h2>
                <div className="space-y-4">
                  {shippingMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`p-4 border rounded-lg cursor-pointer ${
                        selectedShippingMethod?.id === method.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => handleShippingMethodSelect(method.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{method.name}</h3>
                          <p className="text-sm text-gray-500">{method.description}</p>
                        </div>
                        <p className="font-medium">{formatPrice(method.priceWithTax)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Đơn hàng của bạn */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Đơn hàng của bạn</h2>
              {order.lines.map((line: any) => (
                <div key={line.id} className="flex items-center justify-between py-2">
                  <div>
                    <p>{line.productVariant.name}</p>
                    <p className="text-sm text-gray-500">Số lượng: {line.quantity}</p>
                  </div>
                  <p>{formatPrice(line.productVariant.priceWithTax * line.quantity)}</p>
                </div>
              ))}
              <div className="border-t mt-4 pt-4 space-y-2">
                {/* Tổng giá trị sản phẩm */}
                <div className="flex justify-between">
                  <p>Tổng giá trị sản phẩm:</p>
                  <p>{formatPrice(order.lines.reduce((sum: number, line: any) => 
                    sum + (line.productVariant.priceWithTax * line.quantity), 0))}</p>
                </div>
                {/* Phí ship */}
                <div className="flex justify-between">
                  <p>Phí vận chuyển:</p>
                  <p>{formatPrice(order.shippingWithTax)}</p>
                </div>
                {/* Khuyến mãi */}
                {(order.lines.reduce((sum: number, line: any) => 
                  sum + (line.productVariant.priceWithTax * line.quantity), 0) + order.shippingWithTax) > order.totalWithTax && (
                  <div className="flex justify-between text-green-600">
                    <p>Khuyến mãi:</p>
                    <p>-{formatPrice((order.lines.reduce((sum: number, line: any) => 
                      sum + (line.productVariant.priceWithTax * line.quantity), 0) + order.shippingWithTax) - order.totalWithTax)}</p>
                  </div>
                )}
                {/* Tổng cộng */}
                <div className="flex justify-between font-semibold">
                  <p>Tổng cộng:</p>
                  <p>{formatPrice(order.totalWithTax)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
} 