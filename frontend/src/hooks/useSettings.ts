'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSettings, saveSettings } from '@/lib/firestore';
import { AppSettings } from '@/lib/types';

// Skeleton loading state
const SKELETON_TIMEOUT = 8000; // 8s timeout trước khi fallback về offline mode

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Race giữa Firebase và timeout
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), SKELETON_TIMEOUT)
      );

      const data = await Promise.race([getSettings(), timeoutPromise]);
      setSettings(data);
    } catch (e: any) {
      if (e?.message === 'timeout') {
        setError('Kết nối chậm. Kiểm tra mạng hoặc Firebase config.');
      } else {
        setError('Lỗi kết nối Firebase. Kiểm tra lại cấu hình .env.local');
        console.error('Firebase error:', e);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = useCallback(async (partial: Partial<AppSettings>) => {
    await saveSettings(partial);
    setSettings(prev => prev ? { ...prev, ...partial } : null);
  }, []);

  return { settings, loading, error, reload: load, update };
}
