-- Real subscription state. "plan" stays the effective entitlement the app reads,
-- so existing rows keep working; the new columns record what Paystack believes.
ALTER TABLE "User" ADD COLUMN     "paystackCustomerCode" TEXT;
ALTER TABLE "User" ADD COLUMN     "subscriptionCode" TEXT;
ALTER TABLE "User" ADD COLUMN     "subscriptionToken" TEXT;
ALTER TABLE "User" ADD COLUMN     "subscriptionStatus" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "User" ADD COLUMN     "subscriptionPlan" TEXT;
ALTER TABLE "User" ADD COLUMN     "currentPeriodEnd" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN     "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "User_subscriptionCode_key" ON "User"("subscriptionCode");

-- Webhook replay protection.
CREATE TABLE "ProcessedWebhook" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'paystack',
    "event" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProcessedWebhook_receivedAt_idx" ON "ProcessedWebhook"("receivedAt");
