import { Platform } from 'react-native';
import {
  API_BASE_URL as ENV_API_BASE_URL,
  ML_BASE_URL as ENV_ML_BASE_URL,
  FMP_API_KEY as ENV_FMP_API_KEY,
  SENTRY_DSN as ENV_SENTRY_DSN,
  SENTRY_ENVIRONMENT as ENV_SENTRY_ENVIRONMENT,
  SENTRY_RELEASE as ENV_SENTRY_RELEASE,
  SENTRY_DIST as ENV_SENTRY_DIST
} from '@env';

const adaptLocalhostForPlatform = (url) => {
  if (!url) {
    return url;
  }

  if (Platform.OS === 'android') {
    return url.replace('://localhost', '://10.0.2.2').replace('://127.0.0.1', '://10.0.2.2');
  }

  if (Platform.OS === 'ios' && url.includes('10.0.2.2')) {
    return url.replace('://10.0.2.2', '://127.0.0.1');
  }

  return url;
};

const defaultApiBase = Platform.select({
  android: 'http://10.0.2.2:3001',
  ios: 'http://127.0.0.1:3001',
  default: 'http://localhost:3001'
});

const defaultMlBase = Platform.select({
  android: 'http://10.0.2.2:5050',
  ios: 'http://127.0.0.1:5050',
  default: 'http://localhost:5050'
});

export const API_BASE_URL = adaptLocalhostForPlatform(ENV_API_BASE_URL) || defaultApiBase;
export const ML_BASE_URL = adaptLocalhostForPlatform(ENV_ML_BASE_URL) || defaultMlBase;
export const FMP_API_KEY = ENV_FMP_API_KEY || 'demo';
export const SENTRY_DSN = ENV_SENTRY_DSN || '';
export const SENTRY_ENVIRONMENT = ENV_SENTRY_ENVIRONMENT || (__DEV__ ? 'development' : 'production');
export const SENTRY_RELEASE = ENV_SENTRY_RELEASE || 'finover-mobile@dev';
export const SENTRY_DIST = ENV_SENTRY_DIST || 'local';
