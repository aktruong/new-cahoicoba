declare module 'react-time-picker-input' {
  import { ComponentType } from 'react';

  interface TimePickerInputProps {
    value: string;
    onChange: (value: string) => void;
    format?: '12' | '24';
    hourPlaceholder?: string;
    minutePlaceholder?: string;
    className?: string;
  }

  const TimePickerInput: ComponentType<TimePickerInputProps>;
  export default TimePickerInput;
} 