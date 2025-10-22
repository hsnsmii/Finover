import type { Application, ErrorRequestHandler, Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { env } from './env';
import { logger } from './logger';

let sentryEnabled = false;

export const initSentry = (app: Application) => {
  if (!env.SENTRY_DSN) {
    logger.warn('Sentry DSN not provided, skipping Sentry initialization');
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT ?? env.NODE_ENV,
    release: env.SENTRY_RELEASE,
    tracesSampleRate: env.isProduction ? 0.1 : 1.0
  });

  sentryEnabled = true;

  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
};

export const getSentryErrorHandler = (): ErrorRequestHandler => {
  if (!sentryEnabled) {
    return (err, _req, _res, next) => next(err);
  }

  return Sentry.Handlers.errorHandler();
};

export const captureWithSentry = (
  err: Error,
  request?: Request,
  response?: Response,
  context: Record<string, unknown> = {}
) => {
  if (!sentryEnabled) {
    return;
  }

  Sentry.withScope((scope) => {
    if (request) {
      scope.addEventProcessor((event) => Sentry.Handlers.parseRequest(event, request));
    }

    if (response?.locals?.requestId) {
      scope.setTag('requestId', response.locals.requestId);
    }

    Object.entries(context).forEach(([key, value]) => {
      scope.setExtra(key, value as unknown);
    });

    if (response?.locals?.userId) {
      scope.setUser({ id: response.locals.userId });
    }

    Sentry.captureException(err);
  });
};

export const isSentryEnabled = () => sentryEnabled;
