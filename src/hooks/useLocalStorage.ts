import { useState, useEffect, useRef, useCallback } from 'react';

// ===========================|| HOOKS - LOCAL STORE ||=========================== //

export default function useLocalStorage<ValueType>(key: string, defaultValue: ValueType) {
  const [value, setValue] = useState(() => {
    const storedValue = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    return storedValue === null ? defaultValue : JSON.parse(storedValue);
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const listener = (e: StorageEvent) => {
      if (typeof window !== 'undefined' && e.storageArea === localStorage && e.key === key) {
        setValue(e.newValue ? JSON.parse(e.newValue) : e.newValue);
      }
    };
    window.addEventListener('storage', listener);

    return () => {
      window.removeEventListener('storage', listener);
    };
  }, [key, defaultValue]);

  const setValueInLocalStorage = useCallback(
    (newValue: ValueType) => {
      setValue((currentValue: any) => {
        const result = typeof newValue === 'function' ? newValue(currentValue) : newValue;

        // 이전 타임아웃 취소
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // 디바운스된 localStorage 업데이트 (100ms 지연)
        timeoutRef.current = setTimeout(() => {
          if (typeof window !== 'undefined') {
            requestAnimationFrame(() => {
              localStorage.setItem(key, JSON.stringify(result));
            });
          }
        }, 100);

        return result;
      });
    },
    [key]
  );

  // 컴포넌트 언마운트 시 타임아웃 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [value, setValueInLocalStorage];
}
