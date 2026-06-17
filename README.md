# Seat Reservation Platform

A full-stack seat reservation system built with NestJS (backend) and Next.js (frontend). Users can browse available seats, log in, create a reservation, and complete payment via a mock provider that calls back via webhook.

---

## Architecture Overview

```
frontend (Next.js 14)  →  backend (NestJS 10)  →  PostgreSQL 15
        port 3000               port 5000         (internal only)
```

### Backend layers

```
Controller  →  Service (business logic)  →  Repository (DB operations)
```

Every service is backed by an interface with a Symbol injection token. All config values come from typed `registerAs` factories injected via `ConfigType<typeof config>`.

### Payment flow

```
POST /api/payments/initiate/:id
  → validate reservation
  → INSERT payments (status = pending)
  → setTimeout 300ms → dispatchWebhook()
  → fetch http://localhost:5000/api/webhooks/payment   (self-call with HMAC signature)
  → WebhookSignatureMiddleware verifies X-Payment-Signature
  → WebhooksRepository: INSERT webhook_events (idempotency), UPDATE reservation & payment
  → Frontend polls GET /api/reservations/:id until status ≠ pending
```

Cards ending in `0000` simulate payment failure; all others succeed.

---

## Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- [Node.js 20+](https://nodejs.org/) (for local development and tests)
- npm 9+
- `make` (pre-installed on macOS/Linux)

---

## Make Commands

Run `make help` from the project root to list all available targets.

### Docker

| Command | Description |
|---|---|
| `make up` | Start all services in the background (Docker) |
| `make down` | Stop all services |
| `make build` | Rebuild all Docker images |
| `make logs` | Tail logs for all services |
| `make ps` | Show running containers |

### Local development

| Command | Description |
|---|---|
| `make install` | Install all npm dependencies (backend + frontend) |
| `make dev` | Run backend + frontend concurrently with live reload |
| `make be-dev` | Start backend only in watch mode |
| `make fe-dev` | Start frontend only dev server |

### Tests

| Command | Description |
|---|---|
| `make be-test` | Run backend unit tests |
| `make be-test-e2e` | Run backend integration tests |

### Other

| Command | Description |
|---|---|
| `make be-build` | Compile backend TypeScript |
| `make fe-build` | Build frontend for production |
| `make db-reset` | Drop and recreate the local database |

---

## Quick Start (Docker)

**1. Clone the repository**

```bash
git clone <repo-url>
cd mike-assessment
```

**2. Configure environment**

```bash
cp .env.example .env
# Edit .env and set JWT_SECRET and PAYMENT_WEBHOOK_SECRET to strong random values
```

**3. Start all services**

```bash
make up
```

This starts:
- `seat-reservation-db` — PostgreSQL 15 (internal Docker network only, not exposed to host)
- `seat-reservation-backend` — NestJS API on port 5000
- `seat-reservation-frontend` — Next.js on port 3000

Database migrations run automatically on startup (`migrationsRun: true`). The 3 seats (Seat A1, Seat B1, Seat C1) are seeded by `SeatsService.onModuleInit()` on first run.

**4. Verify the backend is healthy**

```bash
curl http://localhost:5000/api/health
# → {"data":{"status":"ok","info":{"database":{"status":"up"}},...}}
```

Open [http://localhost:3000](http://localhost:3000).

---

## Running Locally (without Docker)

Requires a running PostgreSQL instance accessible to the backend.

```bash
# Install all dependencies
make install

# Start backend + frontend together
make dev
```

Or in separate terminals:

```bash
# Terminal 1 — backend (http://localhost:5000)
make be-dev

# Terminal 2 — frontend (http://localhost:3000)
make fe-dev
```

---

## Running Tests

### Unit tests (no database required)

```bash
make be-test
```

Covers `ReservationsService` and `PaymentsService` with fully mocked dependencies.

### Integration tests

Requires a local PostgreSQL instance for the test runner to connect to directly. Start one with Docker if needed:

```bash
docker run -d --name pg-test -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15-alpine
make be-test-e2e
```

The integration suite spins up a full NestJS application against a dedicated `seat_reservation_test` database (created automatically if it doesn't exist), covering:

| Suite | Scenarios |
|---|---|
| Reserve Seat | Authenticated reservation, 401 without token |
| Double Booking | 409 on concurrent reservation, auto-cancel on seat switch |
| Payment Success | Webhook confirms reservation, payment marked `completed` |
| Payment Failure | Webhook cancels reservation, payment marked `failed` |

---

## Deployment

See [docs/deployment.md](docs/deployment.md) for the full deployment plan (server setup, reverse proxy, HTTPS, database backups, rollback).

---

## Environment Configuration

See [docs/environment-configuration.md](docs/environment-configuration.md) for the full variable reference.

---

## API Reference

See [docs/api-reference.md](docs/api-reference.md) for the full endpoint reference.

---

## Key Design Decisions

**Seat double-booking prevention** — `ReservationsRepository.createPendingAtomic()` acquires a pessimistic write lock (`SELECT FOR UPDATE`) on the seat row inside a transaction. A concurrent request blocks until the lock is released, then finds the conflict and throws 409.

**Webhook idempotency** — `webhook_events.eventId` has a UNIQUE constraint. Duplicate webhook deliveries hit a PostgreSQL unique violation (code `23505`), which is caught and returned as `{ alreadyProcessed: true }` without re-processing.

**Webhook signature verification** — `WebhookSignatureMiddleware` computes `HMAC-SHA256(rawBody, webhookSecret)` using `crypto.timingSafeEqual` (constant-time comparison, prevents timing attacks) and rejects requests with an invalid or missing `X-Payment-Signature` header.

**JWT session (90 days)** — Configured via `JWT_EXPIRES_IN=7776000`. The global `JwtAuthGuard` skips routes decorated with `@Public()`.

**Mock payment rule** — Card numbers ending in `0000` (after stripping spaces) simulate a declined card (`payment.failed`, reservation `cancelled`). All other cards succeed.

---

&copy; 2026 [nguyentrongmanh](https://github.com/nguyentrongmanh). All rights reserved.
