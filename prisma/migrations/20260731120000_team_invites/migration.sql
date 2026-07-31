-- Extend TeamMember into a real invitation + membership record
ALTER TABLE "TeamMember" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "TeamMember" ADD COLUMN     "inviteToken" TEXT;
ALTER TABLE "TeamMember" ADD COLUMN     "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "TeamMember" ADD COLUMN     "acceptedAt" TIMESTAMP(3);
ALTER TABLE "TeamMember" ADD COLUMN     "memberUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_inviteToken_key" ON "TeamMember"("inviteToken");

-- CreateIndex
CREATE INDEX "TeamMember_memberUserId_status_idx" ON "TeamMember"("memberUserId", "status");

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_memberUserId_fkey" FOREIGN KEY ("memberUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
