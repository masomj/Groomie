# Pampered Pooch Porthcawl

Professional dog grooming web application built with Nuxt 3, Prisma, and PostgreSQL.

## Tech Stack

- **Nuxt 3** (TypeScript, full-stack)
- **Tailwind CSS** for styling
- **Prisma ORM** with PostgreSQL
- **bcrypt** for password hashing
- **Stripe** for payment processing
- **pdfkit** for invoice PDF generation
- **Docker** for production deployment

## Prerequisites

### Local development
- Node.js 18+
- npm
- PostgreSQL (local or Docker)

### Docker deployment
- Docker 20+
- External PostgreSQL (or use docker-compose for local convenience)

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes (production) | 64-char random string for signing session cookies |
| `STRIPE_SECRET_KEY` | Yes (payments) | Stripe secret API key |
| `STRIPE_WEBHOOK_SECRET` | Yes (payments) | Stripe webhook signing secret |
| `APP_BASE_URL` | Yes | Public app URL for Stripe redirect URLs |
| `SMTP_HOST` | Optional | SMTP server for email confirmations |
| `SMTP_PORT` | Optional | SMTP port (default 587) |
| `SMTP_USER` | Optional | SMTP auth username |
| `SMTP_PASS` | Optional | SMTP auth password |
| `SMTP_FROM` | Optional | From address for emails |
| `NODE_ENV` | Auto | Set to `production` in Docker image |
| `HOST` | Auto | Set to `0.0.0.0` in Docker image |
| `PORT` | Auto | Set to `3000` in Docker image |

If SMTP variables are not set, payment confirmations are logged to console and database instead of emailed.

## Local Development Setup

```bash
# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env — set DATABASE_URL and SESSION_SECRET

# Generate Prisma client
npx prisma generate

# Run database migrations (requires running PostgreSQL)
npx prisma migrate dev

# Seed the database (services, admin user, etc.)
npm run db:seed

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Default Accounts (from seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@pamperedpooch.co.uk | admin1234 |

## Docker Deployment

### Build the image

```bash
docker build -t pampered-pooch .
```

### Run against an external PostgreSQL

```bash
docker run -d \
  --name pampered-pooch \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@your-db-host:5432/pampered_pooch?schema=public" \
  -e SESSION_SECRET="your-64-char-random-secret-here" \
  -e STRIPE_SECRET_KEY="sk_live_..." \
  -e STRIPE_WEBHOOK_SECRET="whsec_..." \
  -e APP_BASE_URL="https://yourdomain.com" \
  -v pampered-pooch-invoices:/app/data/invoices \
  pampered-pooch
```

### Local convenience with docker-compose

```bash
# Starts app + PostgreSQL together
docker-compose up --build

# Seed the database (first run only — run in a separate terminal)
docker-compose exec app npx prisma db seed
```

### Startup behavior

On container start, the entrypoint script:
1. Runs `prisma migrate deploy` to apply any pending migrations
2. Starts the Nitro server

If migrations fail, the container exits immediately with a clear error message.

### Health check

The Docker image includes a built-in `HEALTHCHECK` that polls `/api/health` every 30 seconds.

```bash
# Manual health check
curl http://localhost:3000/api/health
# Returns: {"status":"ok","timestamp":"...","database":"connected"}
```

### Migration strategy

- **Development**: `npx prisma migrate dev` creates and applies migrations
- **Production**: `prisma migrate deploy` runs automatically on container start
- Migrations are idempotent — re-running is safe
- For manual migration control, override the CMD:
  ```bash
  docker run --rm -e DATABASE_URL="..." pampered-pooch npx prisma migrate deploy
  ```

### Invoice storage

Invoice PDFs are generated at runtime by pdfkit and stored on disk at `/app/data/invoices/`.

**Important**: Mount a persistent volume to `/app/data/invoices` in production to preserve invoices across container restarts. Without a volume, PDFs are lost when the container is removed.

```bash
-v pampered-pooch-invoices:/app/data/invoices
```

### Stripe webhook deployment

1. In Stripe Dashboard, add a webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
2. Subscribe to events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
3. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`
4. The webhook endpoint uses Stripe signature verification — no rate limiting is applied to `/api/webhooks/*`
5. Idempotency is handled via the `StripeEvent` table — duplicate deliveries are safe

## Project Structure

```
├── components/          # Reusable Vue components
├── composables/         # Vue composables (useAuth)
├── data/invoices/       # Runtime-generated invoice PDFs
├── layouts/             # Page layouts (navbar, footer)
├── middleware/           # Client-side route middleware (auth, admin)
├── pages/               # File-based routing
│   ├── index.vue        # Home page
│   ├── services.vue     # Services detail
│   ├── pricing.vue      # Pricing guide
│   ├── about.vue        # About page
│   ├── contact.vue      # Contact form
│   ├── privacy.vue      # Privacy policy
│   ├── login.vue        # Login page
│   ├── register.vue     # Registration page
│   ├── dashboard/       # Customer dashboard (auth required)
│   └── admin/           # Admin panel (admin role required)
├── plugins/             # Nuxt plugins (auth init)
├── prisma/
│   ├── schema.prisma    # Database schema (14 models)
│   ├── seed.ts          # Seed script
│   └── migrations/      # Migration files
├── server/
│   ├── api/             # API routes
│   ├── middleware/       # Security headers, rate limiting
│   └── utils/           # Prisma client, session, Stripe, invoices, reporting
├── Dockerfile           # Multi-stage production build
├── docker-compose.yml   # Local convenience (app + Postgres)
└── docker-entrypoint.sh # Migration + server startup
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run test suite |
| `npm run lint` | Run type checking |
| `npm run typecheck` | Run type checking |
| `npm run verify` | Run lint + test + build (full verification) |
| `npm run db:migrate` | Run pending migrations (dev) |
| `npm run db:seed` | Seed the database |
| `npm run db:reset` | Reset database and re-run migrations + seed |
| `npx prisma studio` | Open Prisma database GUI |

## Security

### Headers
All responses include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-XSS-Protection: 1; mode=block`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy` (allows Stripe JS/API domains)

### Rate Limiting
Sensitive endpoints have in-memory rate limits per IP:
- `/api/auth/login` — 10 req/min
- `/api/auth/register` — 5 req/min
- `/api/leads` — 5 req/min
- `/api/payments/checkout` — 10 req/min

The Stripe webhook route (`/api/webhooks/*`) is excluded from rate limiting.

### Session Cookies
- `httpOnly: true` — not accessible via JavaScript
- `sameSite: lax` — CSRF protection
- `secure: true` in production — HTTPS only
- 7-day expiry, stored in database

## Authentication

- **Register**: `POST /api/auth/register` — creates a CUSTOMER account
- **Login**: `POST /api/auth/login` — returns user info, sets session cookie
- **Logout**: `POST /api/auth/logout` — destroys session
- **Current user**: `GET /api/auth/me` — returns logged-in user or `null`

### Route Protection

- `/dashboard` — requires authenticated user (any role)
- `/admin` — requires authenticated user with ADMIN role

## Admin Reporting & Exports

### Reporting API (admin only)

**Summary** — `GET /api/admin/reports/summary?from=YYYY-MM-DD&to=YYYY-MM-DD`

Returns aggregate metrics for the date range.

**Revenue Timeseries** — `GET /api/admin/reports/revenue-timeseries?from=YYYY-MM-DD&to=YYYY-MM-DD&groupBy=day|week|month`

Returns an array of buckets with `period`, `appointmentCount`, `completedCount`, `paidCount`, `grossRevenuePence`.

### CSV Exports (admin only)

Both endpoints require `from` and `to` query parameters (YYYY-MM-DD). Max range: 366 days.

- **Appointments CSV** — `GET /api/admin/exports/appointments.csv?from=...&to=...`
- **Revenue CSV** — `GET /api/admin/exports/revenue.csv?from=...&to=...`

**Money units**: All monetary values use **pence (integer)**. Divide by 100 for GBP.

## Known Caveats

- **Invoice PDFs** are stored on the local filesystem. In containerized environments, mount a persistent volume at `/app/data/invoices` or invoices will be lost on container removal.
- **Rate limiting** is in-memory per process. Behind a load balancer with multiple instances, consider an external rate limiter (e.g., Redis-backed or at the reverse proxy layer).
- **Email** is optional. Without SMTP configuration, payment confirmations are logged to console and stored in the database `PaymentConfirmation` table.
