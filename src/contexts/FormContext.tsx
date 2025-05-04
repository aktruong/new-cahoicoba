"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface FormData {
  fullName: string;
  phoneNumber: string;
  emailAddress: string;
  address: string;
  city: string;
  district: string;
  street: string;
  houseNumber: string;
  shippingMethodId: string;
  paymentMethod: string;
  countryCode: string;
  company?: string;
  addressDetails: string;
}

interface FormContextType {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  resetForm: () => void;
}

const initialFormData: FormData = {
  fullName: '',
  phoneNumber: '',
  emailAddress: '',
  address: '',
  city: '',
  district: '',
  street: '',
  houseNumber: '',
  shippingMethodId: '',
  paymentMethod: '',
  countryCode: '',
  addressDetails: '',
};

const FormContext = createContext<FormContextType | undefined>(undefined);

interface FormProviderProps {
  children: ReactNode;
}

export const FormProvider: React.FC<FormProviderProps> = ({ children }) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const value = {
    formData,
    setFormData,
    resetForm,
  };

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
};

export function useFormContext() {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
} 