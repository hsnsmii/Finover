import {
  API_BASE_URL as ENV_API_BASE_URL,
  ML_BASE_URL as ENV_ML_BASE_URL,
  SENTRY_DSN as ENV_SENTRY_DSN,
  SENTRY_ENVIRONMENT as ENV_SENTRY_ENVIRONMENT,
  SENTRY_RELEASE as ENV_SENTRY_RELEASE,
  SENTRY_DIST as ENV_SENTRY_DIST
} from '@env';

export const API_BASE_URL = ENV_API_BASE_URL || 'http://localhost:8080';
export const ML_BASE_URL = ENV_ML_BASE_URL || 'http://10.11.28.71:5050';
export const SENTRY_DSN = ENV_SENTRY_DSN || '';
export const SENTRY_ENVIRONMENT = ENV_SENTRY_ENVIRONMENT || (__DEV__ ? 'development' : 'production');
export const SENTRY_RELEASE = ENV_SENTRY_RELEASE || 'finover-mobile@dev';
export const SENTRY_DIST = ENV_SENTRY_DIST || 'local';
