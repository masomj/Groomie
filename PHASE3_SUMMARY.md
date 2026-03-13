# Phase 3 Summary — Lead Capture + Booking Management

## 1. Summary of What Was Implemented

### Lead Capture
- **POST /api/leads** — validates name/email (required), phone/message (optional), persists to Lead model with default `NEW` status
- **Contact page** (`pages/contact.vue`) wired to the leads API with loading/success/error states

### Dog Profile CRUD (customer-owned)
- **GET /api/dogs** — returns all dogs owned by the authenticated user
- **POST /api/dogs** — creates a dog profile with full intake fields (name, age, breed, sex, neutered, vaccinated, medicalHistory, dogFriendly, peopleFriendly, emergencyVetName, emergencyVetAddr, notes)
- **GET /api/dogs/:id** — returns a single dog (ownership-checked)
- **PATCH /api/dogs/:id** — partial update (ownership-checked)
- **DELETE /api/dogs/:id** — deletes a dog profile (ownership-checked)
- **Dog management UI** (`pages/dashboard/dogs.vue`) — list, add, edit, delete with all intake fields

### Booking Flow
- **GET /api/services** — returns all active services sorted by sortOrder
- **GET /api/availability?date=YYYY-MM-DD** — derives hourly slots from AvailabilitySlot config, marks booked slots based on existing non-cancelled appointments with overlap detection
- **POST /api/appointments** — creates an appointment with:
  - Auth required, dog ownership verification, active service validation
  - Future-date enforcement
  - **Transaction-based conflict detection** — prevents double-booking with overlap check inside `$transaction`
  - Sets initial status to `PENDING`, price from service's `priceFrom`
- **Booking wizard UI** (`pages/dashboard/book.vue`) — 4-step flow: select service → select dog → pick date/time (with live availability) → confirm with optional notes

### Customer Appointment Management
- **GET /api/appointments** — returns all appointments for the authenticated user with dog/service includes
- **PATCH /api/appointments/:id** — supports `cancel` and `reschedule` actions:
  - Policy: only PENDING/CONFIRMED, at least 24 hours before appointment
  - Reschedule uses transaction-based conflict check, resets status to PENDING
- **Dashboard UI** (`pages/dashboard/index.vue`) — upcoming/past appointment views with cancel and inline reschedule

### Admin Appointment Management
- **GET /api/admin/appointments** — returns all appointments with user/dog/service details, optional status filter
- **PATCH /api/admin/appointments/:id** — admin can set status to any valid value (PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW)
- **Admin UI** (`pages/admin/index.vue`) — table view with status filter dropdown, inline status update via select

### Server-Side Auth Helpers
- `requireAuth(event)` — extracts authenticated user from session or throws 401
- `requireAdmin(event)` — extends requireAuth, throws 403 if not ADMIN role

## 2. Files Changed

### New files
| File | Purpose |
|------|---------|
| `server/utils/auth.ts` | `requireAuth` + `requireAdmin` helpers |
| `server/api/leads.post.ts` | Lead creation endpoint |
| `server/api/services.get.ts` | List active services |
| `server/api/availability.get.ts` | Derive available time slots for a date |
| `server/api/dogs/index.get.ts` | List user's dogs |
| `server/api/dogs/index.post.ts` | Create dog profile |
| `server/api/dogs/[id].get.ts` | Get single dog |
| `server/api/dogs/[id].patch.ts` | Update dog profile |
| `server/api/dogs/[id].delete.ts` | Delete dog profile |
| `server/api/appointments/index.get.ts` | List user's appointments |
| `server/api/appointments/index.post.ts` | Create appointment (conflict-safe) |
| `server/api/appointments/[id].patch.ts` | Reschedule/cancel appointment |
| `server/api/admin/appointments/index.get.ts` | Admin: list all appointments |
| `server/api/admin/appointments/[id].patch.ts` | Admin: update appointment status |
| `pages/dashboard.vue` | Dashboard nested layout wrapper |
| `pages/dashboard/dogs.vue` | Dog profile CRUD UI |
| `pages/dashboard/book.vue` | 4-step booking wizard |
| `pages/admin/index.vue` | Admin appointment management table |

### Modified files
| File | Change |
|------|--------|
| `pages/contact.vue` | Wired form to POST /api/leads with UX feedback |
| `pages/dashboard/index.vue` | Fixed null priceCharged display |

## 3. Commands to Verify Locally

```bash
# Ensure database is migrated and seeded
npm run db:migrate
npm run db:seed

# Start dev server
npm run dev

# Test Lead Capture
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","phone":"07700000000","message":"Hello"}'

# Register/login a customer via the UI at /register
# Then test:
#   /dashboard/dogs — add/edit/delete dog profiles
#   /dashboard/book — walk through the 4-step booking wizard
#   /dashboard — view upcoming/past appointments, cancel/reschedule

# Login as admin (admin@pamperedpooch.co.uk / admin1234)
#   /admin — view all appointments, change status via dropdown
```

## 4. TODOs for Next Phase

- **Phase 4**: Consent template management UI (admin CRUD for consent templates, customer consent capture during booking)
- **Phase 5**: Stripe/payments/invoices integration
- **Phase 6**: Revenue analytics + CSV exports
- **Phase 7**: Dockerization + production hardening
