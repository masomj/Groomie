-- Phase 5: Payments & Invoices

-- Add checkout_session_id and pdf_path to payments
ALTER TABLE "payments" ADD COLUMN "checkout_session_id" TEXT;
ALTER TABLE "payments" ADD COLUMN "pdf_path" TEXT;

-- Make checkout_session_id unique
CREATE UNIQUE INDEX "payments_checkout_session_id_key" ON "payments"("checkout_session_id");

-- Stripe event idempotency table
CREATE TABLE "stripe_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("id")
);

-- Payment confirmation log
CREATE TABLE "payment_confirmations" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient" TEXT,
    "subject" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error" TEXT,

    CONSTRAINT "payment_confirmations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payment_confirmations_payment_id_idx" ON "payment_confirmations"("payment_id");
