import { defineEventHandler, createError, getRequestIP } from 'h3'

// In-memory rate limit store: Map<key, { count, resetAt }>
const store = new Map<string, { count: number; resetAt: number }>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)

// Routes to rate limit: path prefix -> { maxRequests, windowMs }
const RATE_LIMITS: { prefix: string; max: number; windowMs: number }[] = [
  { prefix: '/api/auth/login', max: 10, windowMs: 60_000 },
  { prefix: '/api/auth/register', max: 5, windowMs: 60_000 },
  { prefix: '/api/leads', max: 5, windowMs: 60_000 },
  { prefix: '/api/payments/checkout', max: 10, windowMs: 60_000 },
]

export default defineEventHandler((event) => {
  const path = event.path

  // Never rate limit the Stripe webhook – it uses signature auth and retries
  if (path.startsWith('/api/webhooks/')) return

  const rule = RATE_LIMITS.find((r) => path.startsWith(r.prefix))
  if (!rule) return

  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const key = `${ip}:${rule.prefix}`
  const now = Date.now()

  let entry = store.get(key)
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + rule.windowMs }
    store.set(key, entry)
  }

  entry.count++

  if (entry.count > rule.max) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests. Please try again later.',
    })
  }
})
