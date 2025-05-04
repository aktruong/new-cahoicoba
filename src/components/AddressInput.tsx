"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useFormContext } from '../contexts/FormContext';

// Tọa độ trung tâm: 68 Phùng Văn Cung, Phường 07, Quận Phú Nhuận
const CENTER_LAT = 10.7966;
const CENTER_LNG = 106.6751;
const RADIUS = 10000; // 10km tính bằng mét

// Tạo bounding box cho khu vực 10km
const BOUNDING_BOX = {
  north: CENTER_LAT + (RADIUS / 111000),
  south: CENTER_LAT - (RADIUS / 111000),
  east: CENTER_LNG + (RADIUS / (111000 * Math.cos(CENTER_LAT * Math.PI / 180))),
  west: CENTER_LNG - (RADIUS / (111000 * Math.cos(CENTER_LAT * Math.PI / 180)))
};

// Hàm tính khoảng cách giữa 2 điểm
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371000; // Bán kính Trái đất tính bằng mét
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const HERE_API_KEY = process.env.NEXT_PUBLIC_HERE_API_KEY;
const HERE_APP_ID = process.env.NEXT_PUBLIC_HERE_APP_ID;

// Kiểm tra API key và APP ID
console.log('HERE_API_KEY:', HERE_API_KEY);
console.log('HERE_APP_ID:', HERE_APP_ID);

interface AddressSuggestion {
  id: string;
  title: string;
  address: {
    label: string;
    city: string;
    district: string;
    street: string;
    houseNumber: string;
  };
  position: {
    lat: number;
    lng: number;
  };
}

interface AddressInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  centerLat?: number;
  centerLng?: number;
  addressType?: 'shipping' | 'billing';
  onAddressChange?: (address: any) => void;
  onAddressSelect?: (address: any) => void;
  initialAddress?: any;
}

// Thêm type definitions cho HERE Maps
declare global {
  interface Window {
    H: any;
  }
}

interface MapEvent {
  currentPointer: {
    viewportX: number;
    viewportY: number;
  };
}

interface FormData {
  address: string;
  city: string;
  district: string;
  ward: string;
  street: string;
  houseNumber: string;
  phoneNumber: string;
  fullName: string;
  company: string;
}

export function AddressInput({ 
  value = '', 
  onChange = () => {}, 
  centerLat = 10.7966, 
  centerLng = 106.6751,
  addressType,
  onAddressChange,
  onAddressSelect,
  initialAddress
}: AddressInputProps) {
  const { formData, setFormData } = useFormContext();
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<AddressSuggestion | null>(null);
  const [inputValue, setInputValue] = useState(formData.address);
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef<any>(null);
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [platform, setPlatform] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  const [behavior, setBehavior] = useState<any>(null);
  const [ui, setUI] = useState<any>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Tọa độ trung tâm từ props
  const center = { lat: centerLat, lng: centerLng };

  const loadHERE = async () => {
    try {
      // Kiểm tra xem script đã được tải chưa
      if (!window.H) {
        const loadScript = (src: string): Promise<void> => {
          return new Promise((resolve, reject) => {
            // Kiểm tra xem script đã tồn tại chưa
            if (document.querySelector(`script[src="${src}"]`)) {
              resolve();
              return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = false; // Tải đồng bộ để đảm bảo thứ tự
            script.onload = () => {
              console.log(`Đã tải xong script: ${src}`);
              resolve();
            };
            script.onerror = () => {
              console.error(`Lỗi khi tải script: ${src}`);
              reject(new Error(`Failed to load script: ${src}`));
            };
            document.head.appendChild(script);
          });
        };

        const loadCSS = (href: string): Promise<void> => {
          return new Promise((resolve, reject) => {
            // Kiểm tra xem CSS đã tồn tại chưa
            if (document.querySelector(`link[href="${href}"]`)) {
              resolve();
              return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = () => resolve();
            link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
            document.head.appendChild(link);
          });
        };

        // Tải các script và CSS cần thiết
        await Promise.all([
          loadScript('https://js.api.here.com/v3/3.1/mapsjs-core.js'),
          loadScript('https://js.api.here.com/v3/3.1/mapsjs-service.js'),
          loadScript('https://js.api.here.com/v3/3.1/mapsjs-ui.js'),
          loadScript('https://js.api.here.com/v3/3.1/mapsjs-mapevents.js'),
          loadCSS('https://js.api.here.com/v3/3.1/mapsjs-ui.css')
        ]);
      }

      // Chỉ khởi tạo map khi showMap là true
      if (showMap) {
        initializeMap();
      }
    } catch (error) {
      console.error('Lỗi khi tải HERE Maps:', error);
    }
  };

  const initializeMap = () => {
    try {
      if (!window.H || !window.H.service || !window.H.mapevents) {
        console.error('HERE Maps chưa được tải đúng cách');
        return;
      }

      const mapContainer = document.getElementById('map');
      if (!mapContainer) {
        console.error('Không tìm thấy container cho bản đồ');
        return;
      }

      // Đặt style cho container
      mapContainer.style.width = '100%';
      mapContainer.style.height = '400px';
      mapContainer.style.minHeight = '400px';
      mapContainer.style.backgroundColor = '#f0f0f0';
      mapContainer.style.position = 'relative';
      mapContainer.style.overflow = 'hidden';

      // Đợi một chút để đảm bảo container đã được render
      setTimeout(() => {
        // Kiểm tra lại container sau khi đợi
        if (!mapContainer || mapContainer.offsetWidth === 0 || mapContainer.offsetHeight === 0) {
          console.error('Container chưa được render đúng cách');
          return;
        }

        // Khởi tạo platform với cả API key và APP ID
        const newPlatform = new window.H.service.Platform({
          apikey: HERE_API_KEY,
          app_id: HERE_APP_ID,
          useHTTPS: true
        });

        // Tạo các layer mặc định
        const defaultLayers = newPlatform.createDefaultLayers();

        // Khởi tạo map với vector layer
        const newMap = new window.H.Map(
          mapContainer,
          defaultLayers.vector.normal.map,
          {
            center: selectedLocation 
              ? { lat: selectedLocation.position.lat, lng: selectedLocation.position.lng }
              : { lat: CENTER_LAT, lng: CENTER_LNG },
            zoom: 14,
            pixelRatio: window.devicePixelRatio || 1
          }
        );

        // Lưu map vào ref
        mapRef.current = newMap;

        // Thêm behavior cho bản đồ
        const mapEvents = new window.H.mapevents.MapEvents(newMap);
        const newBehavior = new window.H.mapevents.Behavior(mapEvents);

        // Tạo UI với locale tiếng Anh
        const newUI = window.H.ui.UI.createDefault(newMap, defaultLayers, 'en-US');

        // Tạo marker
        const marker = new window.H.map.Marker(
          selectedLocation 
            ? { lat: selectedLocation.position.lat, lng: selectedLocation.position.lng }
            : { lat: CENTER_LAT, lng: CENTER_LNG }
        );

        // Thêm marker vào bản đồ
        newMap.addObject(marker);

        // Di chuyển bản đồ đến vị trí marker
        newMap.setCenter(marker.getGeometry());

        // Lưu các instance vào state
        setPlatform(newPlatform);
        setMap(newMap);
        setBehavior(newBehavior);
        setUI(newUI);

        // Thêm event listener cho click trên bản đồ
        newMap.addEventListener('tap', (evt: any) => {
          const coord = newMap.screenToGeo(
            evt.currentPointer.viewportX,
            evt.currentPointer.viewportY
          );
          
          // Cập nhật vị trí marker
          marker.setGeometry(coord);

          // Lấy địa chỉ từ tọa độ
          const geocodingService = newPlatform.getSearchService();
          geocodingService.reverseGeocode(
            {
              at: `${coord.lat},${coord.lng}`,
              lang: 'en-US'
            },
            (result: any) => {
              if (result && result.items && result.items.length > 0) {
                const address = result.items[0].address;
                const fullAddress = [
                  address.houseNumber,
                  address.street,
                  address.district,
                  address.city
                ].filter(Boolean).join(', ');
                
                setInputValue(fullAddress);
                setSelectedLocation({
                  id: 'map-selection',
                  title: fullAddress,
                  address: {
                    label: fullAddress,
                    city: address.city || '',
                    district: address.district || '',
                    street: address.street || '',
                    houseNumber: address.houseNumber || '',
                  },
                  position: {
                    lat: coord.lat,
                    lng: coord.lng
                  }
                });

                setFormData({
                  ...formData,
                  address: fullAddress,
                  city: address.city || '',
                  district: address.district || '',
                  street: address.street || '',
                  houseNumber: address.houseNumber || '',
                });
              }
            },
            (error: any) => {
              console.error('Lỗi khi lấy địa chỉ:', error);
            }
          );
        });

        // Thêm event listener cho resize
        const handleResize = () => {
          if (newMap && newMap.getViewPort()) {
            newMap.getViewPort().resize();
          }
        };

        window.addEventListener('resize', handleResize);

        // Đảm bảo map được render đúng
        setTimeout(handleResize, 100);

        return () => {
          window.removeEventListener('resize', handleResize);
        };
      }, 100);
    } catch (error) {
      console.error('Lỗi khi khởi tạo map:', error);
    }
  };

  // Cleanup khi component unmount hoặc showMap thay đổi
  useEffect(() => {
    if (!showMap && map) {
      try {
        if (behavior) {
          behavior.dispose();
        }
        if (ui) {
          ui.dispose();
        }
        if (map) {
          map.dispose();
        }
        setMap(null);
        setBehavior(null);
        setUI(null);
        mapRef.current = null;
      } catch (error) {
        console.error('Lỗi khi cleanup map:', error);
      }
    }
  }, [showMap]);

  // Thêm useEffect để xử lý resize map khi showMap thay đổi
  useEffect(() => {
    if (showMap && mapRef.current) {
      const handleResize = () => {
        if (mapRef.current && mapRef.current.getViewPort()) {
          mapRef.current.getViewPort().resize();
        }
      };

      // Đợi một chút để đảm bảo container đã được render
      setTimeout(handleResize, 100);
      
      // Thêm event listener cho resize window
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [showMap]);

  // Sửa lại useEffect chính để thêm showMap vào dependency
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await loadHERE();
        if (mounted && showMap) {
          // Đảm bảo container map đã tồn tại
          const mapContainer = document.getElementById('map');
          if (mapContainer) {
            // Xóa bản đồ cũ nếu tồn tại
            if (mapRef.current) {
              mapRef.current.dispose();
              mapRef.current = null;
            }
            initializeMap();
          } else {
            console.error('Container map chưa tồn tại');
          }
        }
      } catch (error) {
        console.error('Lỗi khi khởi tạo HERE Maps:', error);
      }
    };

    init();

    return () => {
      mounted = false;
      // Dọn dẹp bản đồ khi component unmount hoặc showMap thay đổi
      if (mapRef.current) {
        mapRef.current.dispose();
        mapRef.current = null;
      }
    };
  }, [showMap]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      address: e.target.value
    });
  };

  // Hàm tìm kiếm địa chỉ với Autosuggest API
  const searchAddress = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/here?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      console.log('=== Dữ liệu từ HERE Maps API ===');
      console.log('1. Dữ liệu thô:', data);
      console.log('2. Items:', data?.items);
      if (data?.items?.[0]) {
        console.log('3. Item đầu tiên:', data.items[0]);
        console.log('4. Address của item đầu tiên:', data.items[0].address);
      }
      console.log('================================');

      if (data?.items) {
        // Lọc các kết quả trùng lặp
        const uniqueItems = data.items.filter((item: any, index: number, self: any[]) => 
          index === self.findIndex((t) => t.address.label === item.address.label)
        );

        setSuggestions(uniqueItems.map((item: any) => ({
          id: item.id || '',
          title: item.title || '',
          address: {
            label: item.address?.label || '',
            city: item.address?.city || '',
            district: item.address?.district || '',
            street: item.address?.street || '',
            houseNumber: item.address?.houseNumber || '',
          },
          position: {
            lat: item.position?.lat || 0,
            lng: item.position?.lng || 0
          }
        })));
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm địa chỉ:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý khi chọn địa chỉ
  const handleSelect = (suggestion: AddressSuggestion) => {
    console.log('=== Dữ liệu địa chỉ từ HERE Maps ===');
    console.log('1. Địa chỉ đầy đủ:', suggestion.address.label);
    console.log('2. Dữ liệu thô từ HERE Maps:', suggestion);
    
    // Parse địa chỉ từ label
    const addressParts = suggestion.address.label.split(', ');
    const streetAndNumber = addressParts[0];
    const ward = addressParts[1];
    const district = addressParts[2];
    const city = addressParts[3];
    const country = addressParts[4];

    // Tách số nhà và tên đường
    const streetMatch = streetAndNumber.match(/^(\d+)\s+(.+)$/);
    const houseNumber = streetMatch ? streetMatch[1] : '';
    const street = streetMatch ? streetMatch[2] : streetAndNumber;

    console.log('3. Chi tiết địa chỉ:');
    console.log('- Số nhà:', houseNumber);
    console.log('- Đường:', street);
    console.log('- Phường:', ward);
    console.log('- Quận:', district);
    console.log('- Thành phố:', city);
    console.log('- Quốc gia:', country);
    console.log('4. Tọa độ:', suggestion.position);
    console.log('==================================');

    setSelectedLocation(suggestion);
    setShowAddressSheet(false);
    setSuggestions([]);
    
    // Cập nhật form data với đầy đủ thông tin
    const updatedFormData = {
      ...formData,
      address: suggestion.address.label,
      city: city,
      district: district,
      ward: ward,
      street: street,
      houseNumber: houseNumber,
      fullName: formData.fullName || (initialAddress?.fullName ?? ''),
      phoneNumber: formData.phoneNumber || (initialAddress?.phoneNumber ?? ''),
      company: formData.company || ''
    };
    setFormData(updatedFormData);

    // Gọi callback nếu có
    if (onAddressSelect) {
      const addressData = {
        fullName: updatedFormData.fullName,
        phoneNumber: updatedFormData.phoneNumber,
        streetLine1: `${streetAndNumber}, ${ward}, ${district}`.trim(),
        streetLine2: '',
        city: city,
        province: city,
        postalCode: '',
        countryCode: 'VN',
        company: updatedFormData.company || ''
      };
      console.log('5. Dữ liệu gửi về backend:', addressData);
      onAddressSelect(addressData);
    }
  };

  // Thêm useEffect để theo dõi thay đổi của formData
  useEffect(() => {
    if (selectedLocation && onAddressSelect) {
      const addressParts = selectedLocation.address.label.split(', ');
      const streetAndNumber = addressParts[0];
      const ward = addressParts[1];
      const district = addressParts[2];
      const city = addressParts[3];
      const country = addressParts[4];

      const streetMatch = streetAndNumber.match(/^(\d+)\s+(.+)$/);
      const houseNumber = streetMatch ? streetMatch[1] : '';
      const street = streetMatch ? streetMatch[2] : streetAndNumber;

      const addressData = {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        streetLine1: `${streetAndNumber}, ${ward}, ${district}`.trim(),
        streetLine2: '',
        city: city,
        province: city,
        postalCode: '',
        countryCode: 'VN',
        company: formData.company || ''
      };

      console.log('6. Dữ liệu gửi về backend từ useEffect:', addressData);
      onAddressSelect(addressData);
    }
  }, [selectedLocation?.id]);

  // Thêm useEffect riêng để theo dõi thay đổi của formData
  useEffect(() => {
    if (selectedLocation && onAddressSelect) {
      const addressParts = selectedLocation.address.label.split(', ');
      const streetAndNumber = addressParts[0];
      const ward = addressParts[1];
      const district = addressParts[2];
      const city = addressParts[3];
      const country = addressParts[4];

      const addressData = {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        streetLine1: `${streetAndNumber}, ${ward}, ${district}`.trim(),
        streetLine2: '',
        city: city,
        province: city,
        postalCode: '',
        countryCode: 'VN',
        company: formData.company || ''
      };

      console.log('7. Dữ liệu gửi về backend từ useEffect formData:', addressData);
      onAddressSelect(addressData);
    }
  }, [formData.fullName, formData.phoneNumber, formData.company]);

  // Debounce tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue.trim().length >= 2 && !selectedLocation) {
        searchAddress(inputValue.trim());
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, selectedLocation?.id]);

  // Đồng bộ inputValue với selectedLocation
  useEffect(() => {
    if (selectedLocation) {
      setInputValue(selectedLocation.address.label);
    }
  }, [selectedLocation]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (suggestionsRef.current) {
        setSuggestions([]);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Tìm kiếm địa chỉ */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Địa chỉ
        </label>
        <div className="relative">
          <input
            type="text"
            id="address"
            name="address"
            value={inputValue}
            onClick={() => {
              setShowAddressSheet(true);
              setSelectedLocation(null);
            }}
            placeholder="Nhập địa chỉ"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            readOnly
          />
        </div>
      </div>

      {/* Thêm chi tiết địa chỉ */}
      <div className="mt-2">
        <input
          type="text"
          id="company"
          value={formData.company || ''}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          className="w-full px-3 py-1.5 text-sm bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:italic"
          placeholder="Thêm chi tiết khi địa chỉ chưa chính xác"
        />
      </div>

      {/* Sheet nhập địa chỉ */}
      {showAddressSheet && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowAddressSheet(false)}
          />

          {/* Sheet content */}
          <div className="absolute inset-0 bg-white transform transition-transform duration-300 ease-out flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 shadow-sm">
              <div className="flex-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddressSheet(false);
                    setShowMap(true);
                  }}
                  className="text-[#1877F2] hover:text-[#166FE5] flex items-center gap-1"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span className="text-sm">Chọn trên bản đồ</span>
                </button>
              </div>
              <button
                onClick={() => setShowAddressSheet(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Search input */}
            <div className="flex-shrink-0 relative p-4">
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    searchAddress(e.target.value);
                  }}
                  placeholder="Nhập địa chỉ"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {isLoading && (
                <div className="absolute right-7 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {suggestions.length > 0 && !selectedLocation ? (
                <div className="suggestions-container">
                  {suggestions.map((item) => (
                    <div 
                      key={item.id} 
                      className="suggestion-item p-4 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        handleSelect(item);
                        setShowAddressSheet(false);
                      }}
                    >
                      <div className="address-label font-medium">{item.address.label}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  {inputValue ? 'Không tìm thấy địa chỉ phù hợp' : 'Nhập địa chỉ để tìm kiếm'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal bản đồ */}
      {showMap && (
        <div className="map-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full h-full md:w-3/4 md:h-3/4 relative flex flex-col">
            {/* Header */}
            <div className="p-4 border-b">
              <div className="text-sm text-gray-600">
                Click vào vị trí trên bản đồ để chọn địa chỉ
              </div>
            </div>
            <div 
              id="map" 
              className="flex-1 relative"
              style={{
                width: '100%',
                height: '100%',
                minHeight: '400px',
                backgroundColor: '#f0f0f0'
              }}
            >
              {/* Nút X ở góc phải bản đồ */}
              <button
                onClick={() => setShowMap(false)}
                className="absolute top-2 right-2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 focus:outline-none"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="p-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {selectedLocation ? `Đã chọn: ${selectedLocation.address.label}` : 'Chưa chọn vị trí'}
              </div>
              <button
                onClick={() => setShowMap(false)}
                className="bg-[#1877F2] text-white rounded-lg px-4 py-2 hover:bg-[#166FE5] focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:ring-offset-2"
              >
                Chọn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddressInput; 