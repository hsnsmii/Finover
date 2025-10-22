import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { SENTRY_DSN, SENTRY_ENVIRONMENT, SENTRY_RELEASE, SENTRY_DIST } from './config';

let initialized = false;

export const initSentry = () => {
  if (initialized || !SENTRY_DSN) {
    return;
  }

  const release =
    SENTRY_RELEASE ||
    `${Constants.expoConfig?.slug ?? 'finover'}@${Constants.expoConfig?.version ?? 'development'}`;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    release,
    dist: (SENTRY_DIST || Constants.expoConfig?.runtimeVersion) ?? 'local',
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    enableNative: true,
    enableNativeCrashHandling: true
  });

  initialized = true;
};

export const captureWithContext = (error, context = {}) => {
  if (!initialized) {
    return;
  }

  Sentry.captureException(error, {
    contexts: {
      app: context
    }
  });
};

export { Sentry };
