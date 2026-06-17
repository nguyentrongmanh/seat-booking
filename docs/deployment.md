# Deployment Plan

## Architecture

```
                        ┌─────────────┐
           Users ──────▶│    Vercel   │  (Frontend — Next.js, CDN edge)
                        └──────┬──────┘
                               │ HTTPS
                        ┌──────▼──────┐
                        │  AWS ALB    │  (Application Load Balancer)
                        └──────┬──────┘
                               │
               ┌───────────────┼───────────────┐
               ▼               ▼               ▼
          [ ECS Task ]    [ ECS Task ]    [ ECS Task ]   ← Auto Scaling Group
          NestJS :5000    NestJS :5000    NestJS :5000
               └───────────────┼───────────────┘
                               │
                        ┌──────▼──────┐
                        │  AWS RDS    │  (PostgreSQL — Multi-AZ)
                        └─────────────┘
```

---

## Services

| Layer | Service | Reason |
|---|---|---|
| Frontend | Vercel | Zero-config Next.js hosting, global CDN, auto-deploy on push |
| Load Balancer | AWS ALB | Distributes traffic across ECS tasks, handles SSL termination |
| Backend | AWS ECS (Fargate) | Serverless containers, no EC2 management |
| Auto Scaling | ECS Auto Scaling | Scales tasks up/down based on CPU/memory thresholds |
| Database | AWS RDS (PostgreSQL) | Managed DB with automated backups, Multi-AZ failover |
| Logging | AWS CloudWatch | Centralised log aggregation from all ECS tasks |
| Secrets | AWS Secrets Manager | Stores `JWT_SECRET`, `PAYMENT_WEBHOOK_SECRET`, DB credentials |
| Registry | AWS ECR | Private Docker image registry for the backend image |

---

## Deployment Flow

```
git push → GitHub Actions CI
              │
              ├─ npm test (unit + integration)
              │
              ├─ docker build → push to ECR
              │
              └─ ecs deploy (update task definition → rolling update)
                      │
                      └─ Vercel auto-deploys frontend in parallel
```

---

## Key Configuration

**Backend environment variables** are stored in AWS Secrets Manager and injected into ECS task definitions at runtime — no secrets in source code or Docker images.

**CORS** — `FRONTEND_URL` is set to the Vercel production URL so the backend only accepts requests from the known frontend origin.

**Database** — RDS connection string uses the private VPC endpoint; the database is not publicly accessible.

---

## Scaling Policy

ECS Auto Scaling triggers when average CPU exceeds 70% across tasks, adding one task at a time up to a configured maximum. ALB health checks on `GET /api/health` ensure traffic is only routed to healthy tasks during deployments.

---

## Observability

- **Logs** — All ECS tasks ship stdout to CloudWatch Logs; one log group per environment (`/ecs/seat-reservation/production`)
- **Metrics** — ALB request count, ECS CPU/memory, and RDS connections tracked in CloudWatch dashboards
- **Alerts** — CloudWatch Alarms notify via SNS on error rate spikes or RDS high CPU

---

## Rollback

ECS keeps the previous task definition revision. A rollback is a single command:

```bash
aws ecs update-service \
  --cluster seat-reservation \
  --service backend \
  --task-definition seat-reservation-backend:<previous-revision>
```

Vercel rollback is one click in the dashboard under **Deployments**.
