-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('ADMISSION', 'MONTHLY', 'EXAM');

-- DropIndex
DROP INDEX "FeeInvoice_studentId_month_key";

-- AlterTable
ALTER TABLE "FeeInvoice" ADD COLUMN     "type" "FeeType" NOT NULL DEFAULT 'MONTHLY';

-- CreateIndex
CREATE INDEX "FeeInvoice_studentId_month_type_idx" ON "FeeInvoice"("studentId", "month", "type");

-- CreateIndex
CREATE INDEX "FeeInvoice_type_idx" ON "FeeInvoice"("type");
