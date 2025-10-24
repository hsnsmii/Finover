import 'express-async-errors';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { initSentry, getSentryErrorHandler } from './config/sentry';
import { authRouter } from './auth/auth.routes';
import { requireAuth } from './auth/auth.middleware';
import { meHandler } from './auth/auth.controller';
import { errorHandler } from './middleware/error.middleware';
import { httpLogger } from './middleware/httpLogger.middleware';
import { globalRateLimiter } from './middleware/rateLimit.middleware';
import { requestIdMiddleware } from './middleware/requestId.middleware';
import { watchlistsRouter } from './routes/watchlists.routes';
import { stocksRouter } from './routes/stocks.routes';

const app = express();

initSentry(app);

const trustProxyValue = env.TRUST_PROXY.toLowerCase();

if (trustProxyValue === 'false') {
  app.set('trust proxy', false);
} else if (trustProxyValue === 'true') {
  app.set('trust proxy', true);
} else {
  const numeric = Number(trustProxyValue);
  app.set('trust proxy', Number.isNaN(numeric) ? env.TRUST_PROXY : numeric);
}

app.disable('x-powered-by');

app.use(requestIdMiddleware);
app.use(globalRateLimiter);

const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
const allowAllOrigins = allowedOrigins.includes('*');

app.use(
  cors({
    origin: (origin, callback) => {
      if (allowAllOrigins || !origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

app.use(compression());
app.use(express.json({ limit: env.REQUEST_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: env.REQUEST_BODY_LIMIT }));

app.use(httpLogger);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/auth', authRouter);
app.use('/api/watchlists', watchlistsRouter);
app.use('/api/stocks', stocksRouter);

app.get('/me', requireAuth, meHandler);

app.use(getSentryErrorHandler());

app.use(errorHandler);

export default app;
