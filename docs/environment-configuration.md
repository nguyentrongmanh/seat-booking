# Environment Configuration

Copy the root example file and edit secrets before starting:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `production` | Runtime environment |
| `PORT` | `5000` | Backend API port |
| `FRONTEND_URL` | `http://localhost:3000` | CORS allowed origin |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USER` | `postgres` | PostgreSQL user |
| `DB_PASSWORD` | `postgres` | PostgreSQL password |
| `DB_NAME` | `seat_reservation` | Database name |
| `JWT_SECRET` | *(change this)* | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | `7776000` | JWT TTL in seconds (90 days) |
| `SEAT_PRICE` | `50` | Price per seat in dollars |
| `PENDING_EXPIRY_MINUTES` | `15` | Minutes before a pending reservation expires |
| `PAYMENT_WEBHOOK_SECRET` | *(change this)* | HMAC secret for webhook signature verification |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | Backend URL baked into the frontend build |

> `JWT_SECRET` and `PAYMENT_WEBHOOK_SECRET` **must** be changed to strong random values in any non-local environment.

For running the backend locally without Docker, also create `backend/.env` with the same variables (the `backend/.env` file is not read by Docker Compose).
