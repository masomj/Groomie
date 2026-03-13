# Release Verification Checklist

Run through these checks before deploying to production.

## Pre-flight

- [ ] `npm run verify` passes (typecheck + tests + build)
- [ ] `docker build -t pampered-pooch .` completes successfully
- [ ] `docker run` starts and reports healthy (`/api/health` returns `status: ok`)

## Auth

- [ ] Register a new customer account at `/register`
- [ ] Login with the new account at `/login`
- [ ] `/dashboard` accessible when logged in
- [ ] Logout works and redirects to home
- [ ] Login with admin account (`admin@pamperedpooch.co.uk` / `admin1234`)
- [ ] `/admin` accessible as admin

## Dog CRUD

- [ ] Add a dog from `/dashboard/dogs`
- [ ] Edit dog details
- [ ] Delete a dog

## Booking + Consent

- [ ] Create a booking from `/dashboard/book`
- [ ] Consent form is presented and can be accepted
- [ ] Appointment appears in dashboard

## Payment + Invoice

- [ ] Stripe checkout redirects correctly
- [ ] After payment, appointment status updates to CONFIRMED
- [ ] Invoice PDF is generated and downloadable
- [ ] Payment success page displays correctly

## Admin

- [ ] Admin can view all appointments at `/admin`
- [ ] Admin can update appointment status
- [ ] Revenue summary at `/admin/reports` loads correctly
- [ ] Revenue timeseries chart renders
- [ ] Appointments CSV export downloads valid CSV
- [ ] Revenue CSV export downloads valid CSV

## Security

- [ ] Health endpoint responds: `curl http://localhost:3000/api/health`
- [ ] Security headers present: `curl -I http://localhost:3000/`
- [ ] Rate limiting active: rapid POST to `/api/auth/login` returns 429 after 10 attempts
- [ ] Stripe webhook signature verification works (test with `stripe trigger`)
- [ ] Session cookie has `httpOnly`, `sameSite=lax`, `secure` (in production)

## Infrastructure

- [ ] Container runs as non-root user
- [ ] Migrations run on startup without error
- [ ] Invoice volume mount persists files across container restarts
- [ ] Container health check reports healthy in `docker ps`

## Known Limitations

- Invoice PDFs are stored on local filesystem — requires persistent volume
- Rate limiting is in-memory — not shared across instances
- Email is optional — if SMTP is not configured, confirmations are logged only
