# Phase 5 Summary — Payments & Invoices

## 1. What was implemented

### Stripe Checkout Integration
- **POST `/api/payments/checkout`** — Authenticated endpoint creates a Stripe Checkout Session for an eligible appointment. Validates ownership (customer or admin), appointment eligibility (not cancelled/no_show, not already paid), and consent compliance. Upserts a `Payment` row as PENDING with the Stripe checkout session ID.

### Stripe Webhook Processing
- **POST `/api/webhooks/stripe`** — Verifies Stripe signature using `STRIPE_WEBHOOK_SECRET`. Handles four event types:
  - `checkout.session.completed` — Marks payment PAID, confirms PENDING appointments, creates invoice + PDF, sends confirmation
  - `payment_intent.succeeded` — Fallback handler for edge cases
  - `payment_intent.payment_failed` — Marks payment FAILED
  - `charge.refunded` — Marks payment REFUNDED, cancels appointment if still active
- **Idempotency** — `stripe_events` table stores processed event IDs; duplicate deliveries return early without side effects.

### Invoice Generation
- Auto-incrementing invoice numbers (INV-0001, INV-0002, ...)
- Invoice + InvoiceItem records created on successful payment
- PDF generated server-side using PDFKit with business header, customer details, line items, and totals
- PDFs stored in `data/invoices/` (gitignored, directory tracked via `.gitkeep`)

### Invoice Download
- **GET `/api/invoices/[number]`** — Authenticated endpoint serves invoice PDF. Ownership check (customer sees own, admin sees all).

### Payment Status Endpoint
- **GET `/api/payments/status`** — Returns payment details for a checkout session ID. Used by the success page.

### Customer Dashboard Updates
- Payment status badges on appointments (PENDING/PAID/FAILED/REFUNDED)
- "Pay Now" button on eligible appointments → redirects to Stripe Checkout
- Invoice download links for paid appointments
- Post-payment success page (`/dashboard/payment-success`) with confirmation details

### Admin Dashboard Updates
- Added Payment and Invoice columns to appointments table
- Payment status badges with colour coding
- Invoice number links (download PDF)
- Table widened to `max-w-7xl` for extra columns

### Confirmation Messaging
- Env-driven: if SMTP vars are configured, sends email with payment confirmation + invoice reference
- If not configured, persists confirmation to `payment_confirmations` table with `channel: 'log'`
- Payment flow never fails due to missing email config

### Tests (vitest)
- `tests/checkout.test.ts` — 8 tests covering: ownership validation, admin override, cancelled/paid rejection, consent requirement, PENDING payment pass-through
- `tests/webhook.test.ts` — 5 tests covering: missing signature rejection, invalid signature rejection, valid signature acceptance, idempotency (new event + duplicate detection)

## 2. Files changed

### New files
| File | Purpose |
|------|---------|
| `server/utils/stripe.ts` | Stripe client singleton |
| `server/utils/invoice.ts` | Invoice creation + PDF generation |
| `server/utils/confirmation.ts` | Payment confirmation (email or log) |
| `server/api/payments/checkout.post.ts` | Stripe Checkout session creation |
| `server/api/payments/status.get.ts` | Payment status lookup |
| `server/api/webhooks/stripe.post.ts` | Stripe webhook handler |
| `server/api/invoices/[number].get.ts` | Invoice PDF download |
| `pages/dashboard/payment-success.vue` | Post-payment confirmation page |
| `prisma/migrations/20260313200000_phase5_payments_invoices/migration.sql` | Schema migration |
| `tests/checkout.test.ts` | Checkout validation tests |
| `tests/webhook.test.ts` | Webhook signature + idempotency tests |
| `data/invoices/.gitkeep` | Invoice storage directory |

### Modified files
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added `checkoutSessionId`, `pdfPath` to Payment; added StripeEvent + PaymentConfirmation models |
| `nuxt.config.ts` | Added Stripe + email runtime config keys; pdfkit in externals |
| `package.json` | Added stripe, pdfkit, vitest, @types/pdfkit deps; test scripts |
| `.env.example` | Added STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, APP_BASE_URL, SMTP vars |
| `.gitignore` | Added `data/invoices/*.pdf` |
| `server/api/appointments/index.get.ts` | Include payment + invoiceItems in response |
| `server/api/admin/appointments/index.get.ts` | Include payment + invoiceItems in response |
| `pages/dashboard/index.vue` | Pay Now button, payment badges, invoice links |
| `pages/admin/index.vue` | Payment + Invoice columns |

## 3. Commands to verify locally

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables in .env
#    - STRIPE_SECRET_KEY=sk_test_...
#    - STRIPE_WEBHOOK_SECRET=whsec_...
#    - APP_BASE_URL=http://localhost:3000

# 3. Run migration (requires running PostgreSQL)
npm run db:migrate

# 4. Run tests
npm test

# 5. Start dev server
npm run dev

# 6. Install Stripe CLI (if not already)
# https://stripe.com/docs/stripe-cli

# 7. Forward Stripe webhooks to local server
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

# 8. Copy the webhook signing secret from stripe listen output → .env STRIPE_WEBHOOK_SECRET

# 9. Test flow:
#    a. Register/login as customer
#    b. Add a dog, book an appointment
#    c. Click "Pay Now" on the appointment
#    d. Use Stripe test card 4242424242424242 (any future exp, any CVC)
#    e. Complete checkout → redirected to payment-success page
#    f. Verify:
#       - Payment status shows PAID on dashboard
#       - Invoice link appears (click to download PDF)
#       - Appointment status updated to CONFIRMED
#       - Admin dashboard shows Payment: PAID and Invoice number

# 10. Trigger test webhook events via Stripe CLI
stripe trigger checkout.session.completed
stripe trigger payment_intent.payment_failed
stripe trigger charge.refunded
```

## 4. TODOs for next phase

- Revenue analytics dashboard (total revenue, payment breakdowns, date range filters)
- CSV export for payments/invoices
- Dockerization & production hardening
- Object storage for invoices (S3/GCS) instead of local filesystem
- Email template improvements (HTML emails)
- Refund UI for admin (trigger Stripe refund from admin dashboard)
