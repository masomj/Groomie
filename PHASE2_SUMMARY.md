# Phase 2 Summary — Data Model + Auth

## 1) Summary of What Was Implemented

### Prisma Schema (full business data model)
- **User** — id, email, password hash, role (CUSTOMER/ADMIN), first/last name, phone, timestamps
- **Session** — database-backed sessions linked to User (cascade delete)
- **Dog** — linked to User (owner); captures all intake form fields: name, age, breed, sex, neutered, vaccinated, medical history, dog-friendly, people-friendly, emergency vet name/address, notes
- **Service** — name, description, price range (pence), duration (minutes), active flag, sort order
- **Appointment** — links User + Dog + Service; status enum (PENDING → CONFIRMED → IN_PROGRESS → COMPLETED | CANCELLED | NO_SHOW), datetime, duration, price charged, notes
- **ConsentTemplate** — versioned consent documents with active flag
- **ConsentRecord** — links appointment + user + template; accepted boolean, JSON payload snapshot, timestamp
- **Payment** — 1:1 with Appointment; amount in pence, status enum, provider/ref fields
- **Invoice** + **InvoiceItem** — invoice header with status enum, line items linked to appointments
- **Lead** — contact form submissions with status tracking (NEW → CONTACTED → CONVERTED | LOST)
- **AvailabilitySlot** — day-of-week + time range slots for scheduling
- **AuditLog** — generic entity/action audit trail with JSON metadata

### Enums
Role, AppointmentStatus, Sex, Friendliness (YES/NO/UNSURE), PaymentStatus, InvoiceStatus, LeadStatus

### Indexes
- Unique: user email, service name, invoice number, consent template title+version, availability day+time
- Query performance: appointments by date/status/user/dog, sessions by user, consent records by user/appointment, invoices by user, leads by status, audit logs by entity+id and user

### Referential Integrity
- Cascade deletes: User→Dogs, User→Sessions, User→Appointments, Dog→Appointments, Appointment→Payment, Invoice→InvoiceItems
- Restrict: Appointment→Service (can't delete a service with bookings), ConsentRecord→ConsentTemplate
- SetNull: ConsentRecord→Appointment (preserve consent if appointment deleted), InvoiceItem→Appointment

### Seed Data
- 4 services (Wash & Dry, Full Groom, De-Shed Treatment, Puppy Groom) with prices in pence
- 1 admin user (admin@pamperedpooch.co.uk / admin1234)
- 1 consent template (Terms & Conditions v1)
- 6 availability slots (Mon–Sat 09:00–17:00)

### Authentication
- **Register** (`POST /api/auth/register`) — validates email/password, hashes with bcrypt (10 rounds), creates CUSTOMER user + session
- **Login** (`POST /api/auth/login`) — validates credentials, creates session
- **Logout** (`POST /api/auth/logout`) — destroys session + cookie
- **Current user** (`GET /api/auth/me`) — returns logged-in user from session or null

### Session Management
- Database-backed sessions (Session model)
- HMAC-SHA256 signed session cookies (httpOnly, sameSite=lax, secure in prod)
- 7-day expiry with server-side validation
- Configurable secret via `SESSION_SECRET` env var

### Route Protection
- `middleware/auth.ts` — redirects unauthenticated users to `/login`
- `middleware/admin.ts` — requires ADMIN role, redirects customers to `/dashboard`
- Auth-aware navbar (login/register links when logged out, dashboard/logout when logged in)

### Protected Pages
- `/dashboard` — customer area (auth middleware)
- `/admin` — admin panel (admin middleware)
- `/login` — login form with error handling
- `/register` — registration form with password confirmation

## 2) Files Changed

### New Files
| File | Purpose |
|---|---|
| `prisma/seed.ts` | Seed script (services, admin user, consent template, availability) |
| `prisma/migrations/20260313000000_phase2_full_schema/migration.sql` | Migration SQL |
| `server/utils/session.ts` | Session create/get/destroy utilities |
| `server/api/auth/register.post.ts` | Registration endpoint |
| `server/api/auth/login.post.ts` | Login endpoint |
| `server/api/auth/logout.post.ts` | Logout endpoint |
| `server/api/auth/me.get.ts` | Current user endpoint |
| `composables/useAuth.ts` | Client-side auth composable |
| `plugins/auth.server.ts` | Server plugin to hydrate auth state |
| `middleware/auth.ts` | Authenticated route guard |
| `middleware/admin.ts` | Admin-only route guard |
| `pages/login.vue` | Login page |
| `pages/register.vue` | Registration page |
| `pages/dashboard.vue` | Customer dashboard (placeholder) |
| `pages/admin/index.vue` | Admin panel (placeholder) |

### Modified Files
| File | Changes |
|---|---|
| `prisma/schema.prisma` | Replaced HealthCheck placeholder with full business schema (14 models, 8 enums) |
| `server/utils/prisma.ts` | Updated import path for Prisma 7 generated client |
| `nuxt.config.ts` | Added runtimeConfig (sessionSecret), Nitro externals config |
| `layouts/default.vue` | Added auth-aware navigation (login/register/dashboard/logout) |
| `package.json` | Added db:migrate, db:seed, db:reset scripts; prisma.seed config; bcrypt + tsx deps |
| `.env.example` | Added SESSION_SECRET variable |
| `.env` | Added SESSION_SECRET variable |
| `README.md` | Rewrote with env vars table, auth docs, updated structure and scripts |

## 3) Commands to Verify Locally

```bash
# 1. Ensure PostgreSQL is running on localhost:5432
#    (Docker: docker run -d -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16)

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. Run migrations (creates all tables)
npx prisma migrate dev

# 5. Seed the database
npm run db:seed

# 6. Inspect schema in Prisma Studio
npx prisma studio

# 7. Start dev server
npm run dev

# 8. Test auth flow:
#    - Visit http://localhost:3000/register → create account → lands on /dashboard
#    - Visit http://localhost:3000/login → login as admin@pamperedpooch.co.uk / admin1234 → lands on /admin
#    - Visit http://localhost:3000/admin as a CUSTOMER → redirected to /dashboard
#    - Click "Log out" → redirected to /login

# 9. Verify build compiles
npx nuxt build
```

## 4) TODOs for Next Phase

- [ ] Dog profile CRUD (add/edit/delete dogs under customer account)
- [ ] Intake form page with all required fields, wired to Dog + ConsentRecord models
- [ ] Appointment booking flow (select service → pick slot → confirm)
- [ ] Admin appointment management (view all, update status, notes)
- [ ] Admin customer/dog directory
- [ ] Contact form → Lead creation (wire existing form to `POST /api/leads`)
- [ ] Stripe integration (Payment model is ready)
- [ ] Invoice generation and PDF export
- [ ] Consent template management UI (admin)
- [ ] Password reset flow
- [ ] Email notifications (confirmation, reminders)
- [ ] Dockerization (Dockerfile + docker-compose with Postgres)
- [ ] Dynamic pricing page from Service table instead of hardcoded values
