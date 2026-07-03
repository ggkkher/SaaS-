'use client';

import { useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/lib/store';

export function useAuth() {
  const { user, isLoading, error, setUser, setLoading, setError, logout } = useAuthStore();

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/auth/me');
        setUser(response.data.user);
      } catch (err) {
        setError(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [setUser, setLoading, setError]);

  return { user, isLoading, error, logout };
}
