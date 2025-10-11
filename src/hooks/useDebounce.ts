import { useState, useEffect, useCallback } from 'react';

// debounce 훅
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// debounced callback 훅
export function useDebouncedCallback<T extends (...args: any[]) => any>(callback: T, delay: number): T {
  const [debouncedCallback, setDebouncedCallback] = useState<T>(callback);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCallback(() => callback);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [callback, delay]);

  return debouncedCallback;
}

// 실시간 입력과 debounced 값을 분리하여 관리하는 훅
export function useOptimizedInput(initialValue: string = '', delay: number = 300) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, delay]);

  const handleChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const reset = useCallback((value: string = '') => {
    setInputValue(value);
    setDebouncedValue(value);
  }, []);

  return {
    inputValue,
    debouncedValue,
    handleChange,
    reset,
    isDirty: inputValue !== debouncedValue
  };
}
