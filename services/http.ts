import { Platform } from 'react-native';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './token';

const DEV_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';
const PROD_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

const BASE_URL = __DEV__ ? DEV_BASE_URL : PROD_BASE_URL;

if (!BASE_URL) {
  throw new Error('API base URL is not configured. Set EXPO_PUBLIC_API_URL for production builds.');
}

type PrimitiveBody = RequestInit['body'];
type JsonCompatible = Record<string, unknown> | Array<unknown>;

type ApiRequestInit = Omit<RequestInit, 'body'> & {
  body?: PrimitiveBody | JsonCompatible | null;
};

export class HttpError<T = unknown> extends Error {
  status: number;
  body: T;

  constructor(status: number, body: T, message?: string) {
    super(message ?? `HTTP ${status}`);
    this.status = status;
    this.body = body;
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

let refreshing: Promise<void> | null = null;

const isAbsoluteUrl = (path: string) => /^https?:\/\//i.test(path);

const buildUrl = (path: string): string => {
  if (isAbsoluteUrl(path)) {
    return path;
  }
  const normalizedBase = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const prepareBody = (body: ApiRequestInit['body']): PrimitiveBody | undefined => {
  if (body === undefined) {
    return undefined;
  }

  if (body === null) {
    return null;
  }

  if (typeof body === 'string') {
    return body;
  }

  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    return body;
  }

  if (typeof Blob !== 'undefined' && body instanceof Blob) {
    return body;
  }

  if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) {
    return body;
  }

  return JSON.stringify(body);
};

async function refreshOnce(): Promise<void> {
  if (!refreshing) {
    refreshing = (async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        throw new Error('NO_REFRESH');
      }

      const response = await fetch(buildUrl('/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        throw new Error(`REFRESH_${response.status}`);
      }

      const json = await response.json();
      await setTokens(json.accessToken, json.refreshToken);
    })().finally(() => {
      refreshing = null;
    });
  }

  return refreshing;
}

export async function api(path: string, init: ApiRequestInit = {}, retry = true): Promise<Response> {
  const { body, headers: initHeaders, ...rest } = init;
  const token = await getAccessToken();

  const headers = new Headers(initHeaders as HeadersInit | undefined);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const request: RequestInit = {
    ...rest,
    headers,
    body: prepareBody(body)
  };

  if (!request.cache) {
    request.cache = 'no-store';
  }

  const response = await fetch(buildUrl(path), request).catch((error) => {
    throw new Error(`NETWORK_${error?.message || 'ERR'}`);
  });

  if (response.status !== 401 || !retry) {
    return response;
  }

  try {
    await refreshOnce();
  } catch (error) {
    await clearTokens();
    throw new Error('UNAUTHORIZED');
  }

  return api(path, init, false);
}

const parseJsonSafely = async (response: Response) => {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export async function apiJson<T = unknown>(path: string, init?: ApiRequestInit, retry = true): Promise<T> {
  const response = await api(path, init, retry);
  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    const message =
      typeof payload === 'string'
        ? payload
        : typeof payload === 'object' && payload && 'message' in payload && typeof payload.message === 'string'
          ? payload.message
          : `HTTP ${response.status}`;
    throw new HttpError(response.status, payload, message);
  }

  return payload as T;
}

export async function apiText(path: string, init?: ApiRequestInit, retry = true): Promise<string> {
  const response = await api(path, init, retry);
  const text = await response.text();

  if (!response.ok) {
    throw new HttpError(response.status, text, text || `HTTP ${response.status}`);
  }

  return text;
}

export { BASE_URL };

export type { ApiRequestInit };
