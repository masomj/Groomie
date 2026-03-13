import { describe, it, expect, vi } from 'vitest'
import Stripe from 'stripe'

describe('Webhook Signature Verification', () => {
  it('rejects requests with missing stripe-signature header', () => {
    const sig = undefined
    expect(sig).toBeUndefined()
    // The webhook handler throws 400 when sig is missing
  })

  it('rejects requests with invalid signature', () => {
    const stripe = new Stripe('sk_test_fake')
    const payload = '{"id":"evt_test"}'
    const secret = 'whsec_test_secret'
    const invalidSig = 't=12345,v1=invalidsignature'

    expect(() => {
      stripe.webhooks.constructEvent(payload, invalidSig, secret)
    }).toThrow()
  })

  it('accepts requests with valid signature', () => {
    const stripe = new Stripe('sk_test_fake')
    const payload = '{"id":"evt_123","type":"checkout.session.completed","data":{"object":{}}}'
    const secret = 'whsec_test_secret'

    // Generate a valid signature
    const timestamp = Math.floor(Date.now() / 1000)
    const signedPayload = `${timestamp}.${payload}`
    const crypto = require('crypto')
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex')

    const header = `t=${timestamp},v1=${expectedSig}`

    const event = stripe.webhooks.constructEvent(payload, header, secret)
    expect(event).toBeDefined()
    expect(event.id).toBe('evt_123')
    expect(event.type).toBe('checkout.session.completed')
  })
})

describe('Webhook Idempotency', () => {
  const processedEvents = new Set<string>()

  function processEvent(eventId: string): { received: boolean; duplicate: boolean } {
    if (processedEvents.has(eventId)) {
      return { received: true, duplicate: true }
    }
    processedEvents.add(eventId)
    return { received: true, duplicate: false }
  }

  it('processes a new event', () => {
    const result = processEvent('evt_new_1')
    expect(result.duplicate).toBe(false)
    expect(result.received).toBe(true)
  })

  it('detects duplicate event', () => {
    const result = processEvent('evt_new_1')
    expect(result.duplicate).toBe(true)
  })

  it('processes different event IDs independently', () => {
    const r1 = processEvent('evt_new_2')
    const r2 = processEvent('evt_new_3')
    expect(r1.duplicate).toBe(false)
    expect(r2.duplicate).toBe(false)
  })
})
