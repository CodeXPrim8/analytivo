-- Second payment gateway (OPay Checkout). Paystack columns stay as-is; these
-- track which provider owns the current paid period and the latest OPay order.
ALTER TABLE "User" ADD COLUMN     "billingProvider" TEXT;
ALTER TABLE "User" ADD COLUMN     "opayReference" TEXT;
ALTER TABLE "User" ADD COLUMN     "opayOrderNo" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_opayReference_key" ON "User"("opayReference");
