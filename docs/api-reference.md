# API Reference

All responses are wrapped: `{ data: <payload>, timestamp: <iso> }`.  
Errors follow: `{ statusCode, message, path, timestamp }`.

## Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Register and receive JWT |
| `POST` | `/api/auth/login` | — | Login and receive JWT |
| `GET` | `/api/auth/me` | Bearer | Current user profile |

## Seats

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/seats` | — | List all seats with live availability |

## Reservations

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/reservations` | Bearer | Reserve a seat (body: `{ seatId }`) |
| `GET` | `/api/reservations/my` | Bearer | Current user's reservation history |
| `GET` | `/api/reservations/:id` | Bearer | Single reservation detail |

## Payments

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/payments/initiate/:reservationId` | Bearer | Submit card, triggers async webhook |

## Webhooks

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/webhooks/payment` | Signature | Payment provider callback (HMAC-SHA256) |

## Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Database connectivity check |
