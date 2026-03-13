-- CreateTable
CREATE TABLE "blockout_periods" (
    "id" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blockout_periods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blockout_periods_starts_at_idx" ON "blockout_periods"("starts_at");

-- CreateIndex
CREATE INDEX "blockout_periods_ends_at_idx" ON "blockout_periods"("ends_at");
