'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSettings, saveSettings } from '@/lib/firestore';
import { AppSettings } from '@/lib/types';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      setSettings(data);
    } catch (e) {
      setError('Không thể kết nối Firebase. Kiểm tra lại cấu hình.');
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
