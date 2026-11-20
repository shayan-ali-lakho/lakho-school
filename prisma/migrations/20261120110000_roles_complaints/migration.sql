ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'FINANCE';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'MANAGER';
CREATE TABLE "Complaint" ("id" TEXT NOT NULL PRIMARY KEY,"subject" TEXT NOT NULL,"message" TEXT NOT NULL,"senderId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,"recipientId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX "Complaint_senderId_createdAt_idx" ON "Complaint" ("senderId","createdAt");
CREATE INDEX "Complaint_recipientId_createdAt_idx" ON "Complaint" ("recipientId","createdAt");
