# Phase 6 Summary — Admin Reporting + CSV Exports

## 1) Summary of what was implemented

**Revenue Analytics APIs** — Two admin-only endpoints for date-filtered reporting:
- `GET /api/admin/reports/summary` — Aggregate KPIs: total/completed/cancelled/no-show appointments, gross/pending/refunded revenue (pence), average booking value, payment status breakdown
- `GET /api/admin/reports/revenue-timeseries` — Bucketed timeseries (day/week/month) with appointment counts and gross revenue per period

**CSV Exports** — Two admin-only endpoints returning downloadable CSVs:
- `GET /api/admin/exports/appointments.csv` — Full appointment details including customer, dog, service, consent, payment, and invoice info (14 columns)
- `GET /api/admin/exports/revenue.csv` — Revenue/tax snapshot per payment with gross/refunded/net amounts, UK tax year hint, and status flags (12 columns)

**Admin Reports UI** — `/admin/reports` page with:
- Date range picker (from/to) with group-by selector (day/week/month)
- 8 KPI cards (total appointments, completed, cancelled/no-show, gross revenue, pending revenue, refunded, avg booking value, payment breakdown)
- Timeseries table with period, appointment counts, paid count, and revenue
- CSV export download links for both appointment and revenue exports

**Shared utilities** — Extracted `parseDateRange`, `escapeCsvField`, and `toCsv` into `server/utils/reporting.ts` to avoid duplication across endpoints.

**Auth guards** — All 4 endpoints use `requireAdmin()` (401 for unauthenticated, 403 for non-admin). Date range validation enforces `from <= to` and max 366-day window.

**Indexes** — Existing `@@index([dateTime])` and `@@index([status])` on appointments are sufficient for the reporting queries. No new migration needed.

## 2) Files changed

| File | Action |
|---|---|
| `server/utils/reporting.ts` | **New** — Shared date parsing + CSV helpers |
| `server/api/admin/reports/summary.get.ts` | **New** — Summary analytics endpoint |
| `server/api/admin/reports/revenue-timeseries.get.ts` | **New** — Timeseries endpoint |
| `server/api/admin/exports/appointments.csv.get.ts` | **New** — Appointments CSV export |
| `server/api/admin/exports/revenue.csv.get.ts` | **New** — Revenue CSV export |
| `pages/admin/reports.vue` | **New** — Admin reports UI page |
| `pages/admin/index.vue` | **Modified** — Added Reports nav link |
| `README.md` | **Modified** — Documented reporting routes, CSV columns, money units |

## 3) Commands to verify locally

```bash
# Start dev server
npm run dev

# Login as admin
# Navigate to http://localhost:3000/admin/reports

# Test summary API directly
curl "http://localhost:3000/api/admin/reports/summary?from=2025-01-01&to=2025-12-31" \
  --cookie "pp_session=<your-session-cookie>"

# Test timeseries API
curl "http://localhost:3000/api/admin/reports/revenue-timeseries?from=2025-01-01&to=2025-12-31&groupBy=month" \
  --cookie "pp_session=<your-session-cookie>"

# Download appointments CSV
curl -o appointments.csv "http://localhost:3000/api/admin/exports/appointments.csv?from=2025-01-01&to=2025-12-31" \
  --cookie "pp_session=<your-session-cookie>"

# Download revenue CSV
curl -o revenue.csv "http://localhost:3000/api/admin/exports/revenue.csv?from=2025-01-01&to=2025-12-31" \
  --cookie "pp_session=<your-session-cookie>"

# Verify auth guard (should return 401)
curl "http://localhost:3000/api/admin/reports/summary?from=2025-01-01&to=2025-12-31"

# Verify validation (should return 400)
curl "http://localhost:3000/api/admin/reports/summary?from=2025-12-31&to=2025-01-01" \
  --cookie "pp_session=<your-session-cookie>"
```

## 4) TODOs for next phase

- **Phase 7: Dockerization & Production Hardening**
  - Dockerfile + docker-compose for single-app image with Postgres
  - Production environment config (SESSION_SECRET, DATABASE_URL, STRIPE keys)
  - Health check endpoint
  - Static asset caching headers
  - Rate limiting on auth endpoints
  - HTTPS / reverse proxy config
  - CI pipeline (build, lint, test)
