-- Turn Report into a real, deliverable reporting view
ALTER TABLE "Report" ADD COLUMN     "rangeDays" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "Report" ADD COLUMN     "recipients" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Report" ADD COLUMN     "lastSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Report_schedule_idx" ON "Report"("schedule");
