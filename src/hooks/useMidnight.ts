import dayjs from 'dayjs';
import {useEffect, useRef} from 'react';

// 앱이 켜진 상태에서 날짜가 바뀔 때(자정)마다 callback 호출
export function useMidnight(callback: () => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      // 자정 1초 뒤로 예약해서 dayjs()가 확실히 다음 날을 가리키도록 함
      const delay = dayjs().add(1, 'day').startOf('day').diff(dayjs()) + 1000;
      timer = setTimeout(() => {
        callbackRef.current();
        schedule();
      }, delay);
    };

    schedule();
    return () => clearTimeout(timer);
  }, []);
}
