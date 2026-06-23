import { useState, useCallback } from 'react';
import { api } from '../api';
import type { EnvVar } from '../types';

export function useEnvVars() {
  const [vars, setVars] = useState<EnvVar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getEnvVars();
      setVars(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  return { vars, loading, error, refresh };
}
