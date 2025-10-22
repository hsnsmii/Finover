import * as Sentry from '@sentry/react-native';
import { apiClient, clearSession, getCurrentRefreshToken, hasStoredRefreshToken, refreshSession, setSession } from './client';

const handleAuthResponse = async (response) => {
  await setSession(response.tokens);
  return response;
};

export const register = async ({ email, password }) => {
  const response = await apiClient.post('/auth/register', { email, password }, { auth: false });
  return handleAuthResponse(response);
};

export const login = async ({ email, password }) => {
  const response = await apiClient.post('/auth/login', { email, password }, { auth: false });
  return handleAuthResponse(response);
};

export const refresh = async () => {
  const response = await refreshSession();
  return handleAuthResponse(response);
};

export const logout = async () => {
  const refreshToken = await getCurrentRefreshToken();

  if (refreshToken) {
    try {
      await apiClient.post('/auth/logout', { refreshToken }, { auth: true });
    } catch (error) {
      Sentry.captureException(error, {
        contexts: {
          api: { endpoint: '/auth/logout' }
        }
      });
    }
  }

  await clearSession();
};

export const fetchProfile = async () => {
  const response = await apiClient.get('/me');
  return response.user;
};

export const changePassword = async ({ currentPassword, newPassword }) => {
  await apiClient.post('/auth/change-password', { currentPassword, newPassword });
};

export const bootstrap = async () => {
  const hasToken = await hasStoredRefreshToken();
  if (!hasToken) {
    return null;
  }

  try {
    const response = await refresh();
    return response;
  } catch (error) {
    await clearSession();
    return null;
  }
};
