'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export function useRestTimer(onComplete?: () => void) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [total, setTotal] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback((duration: number) => {
    setTotal(duration);
    setSeconds(duration);
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => setIsRunning(false), []);
  const resume = useCallback(() => setIsRunning(true), []);

  const skip = useCallback(() => {
    setIsRunning(false);
    setSeconds(0);
    if (onComplete) onComplete();
  }, [onComplete]);

  const adjust = useCallback((delta: number) => {
    setSeconds(prev => Math.max(0, prev + delta));
    setTotal(prev => Math.max(0, prev + delta));
  }, []);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          // Vibrate khi hết giờ
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
          if (onComplete) onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, onComplete]);

  const progress = total > 0 ? (total - seconds) / total : 0;
  const formattedTime = `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

  return { seconds, isRunning, progress, formattedTime, start, pause, resume, skip, adjust };
}
