import * as Sentry from '@sentry/react-native';
import { api, apiJson } from '../http';
import { clearTokens, getRefreshToken, setTokens } from '../token';

const handleAuthResponse = async (response) => {
  if (response?.tokens?.accessToken) {
    await setTokens(response.tokens.accessToken, response.tokens.refreshToken);
  }
  return response;
};

export const register = async ({ email, password }) => {
  const response = await apiJson('/auth/register', {
    method: 'POST',
    body: { email, password }
  });
  return handleAuthResponse(response);
};

export const login = async ({ email, password }) => {
  const response = await apiJson('/auth/login', {
    method: 'POST',
    body: { email, password }
  });
  return handleAuthResponse(response);
};

export const refresh = async () => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw new Error('Refresh token missing');
  }

  const response = await apiJson(
    '/auth/refresh',
    {
      method: 'POST',
      body: { refreshToken }
    },
    false
  );

  return handleAuthResponse(response);
};

export const logout = async () => {
  const refreshToken = await getRefreshToken();

  if (refreshToken) {
    try {
      const res = await api('/auth/logout', {
        method: 'POST',
        body: { refreshToken }
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Logout failed with status ${res.status}`);
      }
    } catch (error) {
      Sentry.captureException(error, {
        contexts: {
          api: { endpoint: '/auth/logout' }
        }
      });
    }
  }

  await clearTokens();
};

export const fetchProfile = async () => {
  const response = await apiJson('/me');
  return response.user;
};

export const changePassword = async ({ currentPassword, newPassword }) => {
  await apiJson('/auth/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword }
  });
};

export const bootstrap = async () => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await refresh();
    return response;
  } catch (error) {
    await clearTokens();
    return null;
  }
};
