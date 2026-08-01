-- Scope a report to specific links. Empty means every link in the workspace,
-- which keeps existing reports behaving exactly as they did before.
ALTER TABLE "Report" ADD COLUMN     "linkIds" TEXT NOT NULL DEFAULT '';
