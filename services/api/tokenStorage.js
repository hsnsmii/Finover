import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Sentry from '@sentry/react-native';

const REFRESH_TOKEN_KEY = 'finover.refreshToken';

const secureOptions = Platform.select({
  ios: {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY
  },
  android: {
    requireAuthentication: false
  },
  default: {}
});

let secureStoreAvailabilityPromise;

const ensureSecureStore = async () => {
  if (!secureStoreAvailabilityPromise) {
    secureStoreAvailabilityPromise = SecureStore.isAvailableAsync();
  }
  return secureStoreAvailabilityPromise;
};

export const storeRefreshToken = async (token) => {
  const available = await ensureSecureStore();
  if (!available) {
    Sentry.captureMessage('SecureStore unavailable, skip storing refresh token', 'warning');
    return false;
  }
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token, secureOptions);
  return true;
};

export const getRefreshToken = async () => {
  const available = await ensureSecureStore();
  if (!available) {
    return null;
  }
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
};

export const removeRefreshToken = async () => {
  const available = await ensureSecureStore();
  if (!available) {
    return;
  }
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
};
