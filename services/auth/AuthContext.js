import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/auth';
import { captureWithContext } from '../sentry';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const session = await authApi.bootstrap();
        if (session && mounted) {
          setUser(session.user);
          await AsyncStorage.setItem('userId', session.user.id);
        }
      } catch (error) {
        captureWithContext(error, { stage: 'bootstrap' });
      } finally {
        if (mounted) {
          setBootstrapping(false);
        }
      }
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const session = await authApi.login({ email, password });
    setUser(session.user);
    await AsyncStorage.setItem('userId', session.user.id);
    return session;
  }, []);

  const register = useCallback(async (email, password) => {
    const session = await authApi.register({ email, password });
    setUser(session.user);
    await AsyncStorage.setItem('userId', session.user.id);
    return session;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    await AsyncStorage.multiRemove(['userId']);
  }, []);

  const refreshProfile = useCallback(async () => {
    const profile = await authApi.fetchProfile();
    setUser(profile);
    await AsyncStorage.setItem('userId', profile.id);
    return profile;
  }, []);

  const value = useMemo(
    () => ({
      user,
      bootstrapping,
      login,
      register,
      logout,
      refreshProfile,
      setUser
    }),
    [user, bootstrapping, login, register, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
