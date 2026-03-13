# Phase 4 Summary — Consent Workflow (Versioned)

## 1. Summary of What Was Implemented

### Admin Consent Template Management
- **CRUD APIs** for consent templates with admin-only access:
  - `GET /api/admin/consent-templates` — list all templates with record counts
  - `POST /api/admin/consent-templates` — create a new template (auto-increments version per title)
  - `PATCH /api/admin/consent-templates/:id` — edit a template (blocked if it has existing consent records)
  - `POST /api/admin/consent-templates/:id/activate` — atomically deactivates all templates and activates the selected one
- **Admin UI** (`/admin/consent`) — table of templates with status badges, create/edit form, activate buttons
- Templates support: title, version (auto-incremented), body (terms text), optional structured questions (JSON), active flag

### Booking Consent Capture
- **Booking flow extended** from 4 steps to 5 (when an active consent template exists):
  1. Choose service
  2. Select dog
  3. Pick date/time
  4. **Terms & Conditions** — displays active template body, requires checkbox acceptance and typed full-name signature
  5. Confirm booking (shows consent accepted status in summary)
- If no active consent template exists, step 4 is skipped (booking flow remains 4 steps)
- Public API `GET /api/consent/active` returns the active template for the booking UI

### ConsentRecord Persistence
- On booking confirmation, an immutable `ConsentRecord` is created **atomically within the same Prisma transaction** as the appointment
- Record stores: `accepted`, `capturedAt` timestamp, template reference, and a `payload` JSON snapshot containing:
  - `signedName` (typed signature)
  - `templateTitle`, `templateVersion`, `templateBody` (immutable snapshot)
  - `acceptedAt` ISO timestamp

### Enforcement Rules
- **Server-side validation**: if an active consent template exists, the booking API rejects requests without valid consent acceptance
- Template ID is verified server-side to match the current active template (prevents stale consent submissions)
- Client-side validation requires both checkbox acceptance and typed name before proceeding
- Templates with existing consent records cannot be edited (must create a new version)

### Admin Visibility
- Admin appointments table now includes a **Consent** column showing:
  - Green "Yes" badge with expandable details (template title/version, accepted timestamp, signed name)
  - Grey "No" badge for appointments without consent
- Link to "Consent Templates" management page from admin appointments view

## 2. Files Changed

### Schema & Migration
- `prisma/schema.prisma` — added `questions Json?` field to ConsentTemplate, changed `active` default to `false`
- `prisma/migrations/20260313100000_phase4_consent_questions/migration.sql` — migration for new field
- `prisma/migrations/migration_lock.toml` — added (was missing)

### Server API Routes (new)
- `server/api/consent/active.get.ts` — public endpoint returning active consent template
- `server/api/admin/consent-templates/index.get.ts` — list all templates (admin)
- `server/api/admin/consent-templates/index.post.ts` — create template (admin)
- `server/api/admin/consent-templates/[id].patch.ts` — edit template (admin)
- `server/api/admin/consent-templates/[id]/activate.post.ts` — activate template (admin)

### Server API Routes (modified)
- `server/api/appointments/index.post.ts` — added consent validation + atomic ConsentRecord creation
- `server/api/admin/appointments/index.get.ts` — includes consentRecords with template info

### Pages (new)
- `pages/admin/consent.vue` — admin consent template management UI

### Pages (modified)
- `pages/dashboard/book.vue` — added consent step (step 4) to booking wizard
- `pages/admin/index.vue` — added consent status column and link to consent templates

## 3. Commands to Verify Locally

```bash
# 1. Run the migration
npx prisma migrate dev

# 2. Seed the database (includes active consent template)
npx prisma db seed

# 3. Start the dev server
npm run dev

# 4. Verification steps:

# Admin — Consent Template Management:
# - Log in as admin (admin@pamperedpooch.co.uk / admin1234)
# - Navigate to /admin → click "Consent Templates"
# - Verify seeded "Terms & Conditions" v1 is shown as Active
# - Create a new template, verify auto-version increment
# - Try editing a template with no records (should work)
# - Activate a different template (should deactivate the previous one)

# Customer — Booking with Consent:
# - Register a new customer account
# - Add a dog via /dashboard/dogs
# - Go to /dashboard/book
# - Complete steps 1-3 (service, dog, date/time)
# - Step 4 should show Terms & Conditions with checkbox + signature
# - Verify cannot proceed without accepting + typing name
# - Complete booking, verify success

# Admin — Consent Visibility:
# - Go to /admin (appointments list)
# - Verify "Consent" column shows "Yes" for new bookings
# - Click "details" to expand consent info (template version, timestamp, signature)
# - Older appointments without consent show "No"

# Server-side Enforcement:
# - Try POST /api/appointments without consent field → should get 400 error
# - Try POST /api/appointments with accepted: false → should get 400 error
# - Try POST /api/appointments with wrong templateId → should get 400 error
```

## 4. TODOs for Next Phase

- Stripe/payment integration (Payment model already exists in schema)
- Invoice generation and management
- Revenue analytics and CSV export
- Docker image build + production hardening
- Email notifications (booking confirmation, reminders)
- Audit logging (AuditLog model exists but unused)
- Lead management admin UI
