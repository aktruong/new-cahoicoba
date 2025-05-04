"use client";

import React from 'react';
import { useFormContext } from '../contexts/FormContext';

export function CustomerInfoInput() {
  const { formData, setFormData } = useFormContext();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
          Họ và tên
        </label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          value={formData.firstName}
          onChange={(e) => handleInputChange('firstName', e.target.value)}
          className="w-full px-4 py-3 border rounded-lg text-base"
          placeholder="Nhập họ và tên"
          required
        />
      </div>

      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
          Số điện thoại
        </label>
        <input
          type="tel"
          id="phoneNumber"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
          className="w-full px-4 py-3 border rounded-lg text-base"
          placeholder="Nhập số điện thoại"
          required
        />
      </div>
    </div>
  );
}

export default CustomerInfoInput; 