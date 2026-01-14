import { useEffect, useRef, useState } from 'react';

interface UseInactivityTimerProps {
  isActive: boolean; // 是否启用计时器
  timeout: number; // 超时时间（毫秒）
  onTimeout: () => void; // 超时回调
}

export function useInactivityTimer({ isActive, timeout, onTimeout }: UseInactivityTimerProps) {
  const [hasTriggered, setHasTriggered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setHasTriggered(false);
    
    if (isActive) {
      timerRef.current = setTimeout(() => {
        if (!hasTriggered) {
          setHasTriggered(true);
          onTimeout();
        }
      }, timeout);
    }
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setHasTriggered(false);
  };

  useEffect(() => {
    if (isActive) {
      resetTimer();
    } else {
      stopTimer();
    }

    return () => {
      stopTimer();
    };
  }, [isActive, timeout]);

  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, []);

  return { resetTimer, stopTimer, hasTriggered };
}