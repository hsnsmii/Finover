# Finov

This project now ships with a hardened TypeScript/Express authentication API and a React Native client that shares the same security model (JWT access tokens + rotating refresh tokens, Argon2 password hashing, Sentry logging and request correlation).

## Mobile app configuration

Copy `app.env.example` to `.env` in the project root and adjust the values to match your environment. These variables are consumed through `react-native-dotenv` in `services/config.js`.

```bash
cp app.env.example .env
```

- `API_BASE_URL`: HTTP endpoint of the Express backend (defaults to `http://localhost:8080`).
- `ML_BASE_URL`: Optional ML service endpoint.
- `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE`, `SENTRY_DIST`: Sentry configuration for the React Native app.

Install new mobile dependencies and run the app with Expo:

```bash
npm install            # installs @sentry/react-native and expo-secure-store
npm start              # or expo start
```

The client keeps the access token in memory, stores the refresh token inside `expo-secure-store`, retries requests automatically after a 401, and logs errors to Sentry via a global error boundary (`components/ErrorFallback`).

## Backend service

The backend lives in the `backend/` directory and exposes the following endpoints:

| Method | Path                | Description                                  |
|--------|---------------------|----------------------------------------------|
| POST   | `/auth/register`    | Create account, returns tokens + profile     |
| POST   | `/auth/login`       | Authenticate, returns tokens + profile       |
| POST   | `/auth/refresh`     | Rotating refresh token with reuse detection  |
| POST   | `/auth/logout`      | Revokes the current refresh token            |
| POST   | `/auth/change-password` | Change password with current password check |
| GET    | `/me`               | Returns authenticated user profile           |

### Environment variables

Copy the sample environment file and adjust values:

```bash
cd backend
cp .env.example .env
```

Key variables:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Secrets for signing tokens |
| `ACCESS_TTL`, `REFRESH_TTL` | Token lifetimes (e.g. `15m`, `7d`) |
| `SENTRY_DSN` | Optional backend Sentry DSN |
| `CORS_ORIGIN` | Frontend origin(s), comma separated |

### Running locally

```bash
cd backend
npm install                 # install TS backend deps (requires internet access)
npm run prisma:generate     # generate Prisma client
npm run prisma:migrate      # run migrations against the configured database
npm run dev                 # start the Express server on http://localhost:8080
```

Use the provided `docker-compose.yml` to start Postgres and the backend together:

```bash
cd backend
docker compose up
```

Migrations are executed automatically before the dev server starts. Logs are JSON formatted, include `x-request-id`, and Sentry captures enriched context for unhandled errors.

### Testing

Integration tests live under `backend/tests` and use Jest + Supertest:

```bash
cd backend
npm test
```

Tests cover full auth flows (register, login, refresh rotation, reuse detection, logout, password change) and password rehash checks. The test setup runs `prisma migrate deploy` automatically before the suite.

HTTP request examples for each auth endpoint are available in `backend/http/auth.http` (usable with REST Client or VS Code Thunder Client).

## Portfolio Risk API

The ML service exposes `/portfolio-risk` which accepts a list of positions and
returns an overall risk score computed with volatility, beta and correlations.

Example payload:

```json
{
  "positions": [
    {"symbol": "AAPL", "quantity": 3, "price": 100, "volatility": 0.2, "beta": 1.1},
    {"symbol": "MSFT", "quantity": 2, "price": 250, "volatility": 0.15, "beta": 0.9}
  ]
}
```

## Advanced Modelling Features

The machine learning pipeline also includes tools for more sophisticated
analysis:

- **Time series cross validation** using `TimeSeriesSplit` to avoid data leakage
  when evaluating models.
- **Hyperparameter optimization** with `GridSearchCV` for models like
  `RandomForestRegressor` or `XGBRegressor`.
- **Risk metrics** such as Value-at-Risk (VaR) and Conditional VaR are available
  through helper functions in `portfolio_risk.py`.
