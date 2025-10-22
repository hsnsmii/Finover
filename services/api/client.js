import * as Sentry from '@sentry/react-native';
import { API_BASE_URL } from '../config';
import { getRefreshToken, removeRefreshToken, storeRefreshToken } from './tokenStorage';

const createRequestId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

class ApiError extends Error {
  constructor(message, status, data, requestId) {
    super(message);
    this.status = status;
    this.data = data;
    this.requestId = requestId;
  }
}

let accessToken = null;
let refreshTokenCache = null;
let refreshPromise = null;

const buildUrl = (path) => {
  if (path.startsWith('http')) {
    return path;
  }
  return `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

const setRefreshToken = async (token) => {
  refreshTokenCache = token;
  if (token) {
    await storeRefreshToken(token);
  }
};

export const setSession = async (tokens) => {
  accessToken = tokens.accessToken;
  if (tokens.refreshToken) {
    await setRefreshToken(tokens.refreshToken);
  }
};

export const clearSession = async () => {
  accessToken = null;
  refreshTokenCache = null;
  await removeRefreshToken();
};

export const hasStoredRefreshToken = async () => {
  if (refreshTokenCache) {
    return true;
  }
  refreshTokenCache = await getRefreshToken();
  return Boolean(refreshTokenCache);
};

const refreshTokens = async () => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const currentRefreshToken = refreshTokenCache ?? (await getRefreshToken());
    refreshTokenCache = currentRefreshToken;

    if (!currentRefreshToken) {
      throw new ApiError('Refresh token missing', 401);
    }

    const response = await baseFetch('/auth/refresh', {
      method: 'POST',
      body: { refreshToken: currentRefreshToken },
      auth: false,
      retry: false
    });

    await setSession(response.tokens);
    return response;
  })();

  try {
    const refreshed = await refreshPromise;
    return refreshed;
  } catch (error) {
    await clearSession();
    throw error;
  } finally {
    refreshPromise = null;
  }
};

const parseResponse = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
};

const baseFetch = async (path, { method = 'GET', headers = {}, body, auth = true, retry = true } = {}) => {
  const requestId = createRequestId();
  const finalHeaders = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-request-id': requestId,
    ...headers
  };

  if (auth && accessToken) {
    finalHeaders.Authorization = `Bearer ${accessToken}`;
  }

  const url = buildUrl(path);
  const requestInit = {
    method,
    headers: finalHeaders
  };

  if (body !== undefined) {
    requestInit.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const startedAt = Date.now();

  try {
    const response = await fetch(url, requestInit);
    const parsed = await parseResponse(response);

    if (response.status === 401 && auth && retry) {
      await refreshTokens();
      return baseFetch(path, { method, headers, body, auth: true, retry: false });
    }

    if (!response.ok) {
      throw new ApiError(parsed?.message || 'Request failed', response.status, parsed, requestId);
    }

    return parsed;
  } catch (error) {
    const duration = Date.now() - startedAt;
    if (!(error instanceof ApiError) || error.status >= 500) {
      Sentry.captureException(error, {
        contexts: {
          api: {
            url,
            method,
            requestId,
            duration,
            hasAccessToken: Boolean(accessToken)
          }
        }
      });
    }
    throw error;
  }
};

const request = (path, options) => baseFetch(path, options);

const get = (path, options = {}) => request(path, { ...options, method: 'GET' });
const post = (path, body, options = {}) => request(path, { ...options, method: 'POST', body });
const patch = (path, body, options = {}) => request(path, { ...options, method: 'PATCH', body });

export const apiClient = {
  request,
  get,
  post,
  patch,
  setSession,
  clearSession,
  hasStoredRefreshToken
};

export const refreshSession = refreshTokens;

export const getCurrentAccessToken = () => accessToken;

export const getCurrentRefreshToken = async () => {
  if (refreshTokenCache) {
    return refreshTokenCache;
  }
  refreshTokenCache = await getRefreshToken();
  return refreshTokenCache;
};

export { ApiError };
