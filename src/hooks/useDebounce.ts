import {useCallback, useRef} from 'react';

export const useDebounce = (callback: (...args: any[]) => void, delay: number = 300) => {
  const lastExecutionTime = useRef<number>(0);

  return useCallback(
    (...args: any[]) => {
      const now = Date.now();
      if (now - lastExecutionTime.current >= delay) {
        lastExecutionTime.current = now;
        callback(...args);
      }
    },
    [callback, delay],
  );
};

export const useThrottle = (callback: (...args: any[]) => void, delay: number = 300) => {
  const isThrottled = useRef<boolean>(false);

  return useCallback(
    (...args: any[]) => {
      if (!isThrottled.current) {
        callback(...args);
        isThrottled.current = true;
        setTimeout(() => {
          isThrottled.current = false;
        }, delay);
      }
    },
    [callback, delay],
  );
};
