-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "monthlyFee" INTEGER;

-- AlterTable
ALTER TABLE "SalaryRecord" ADD COLUMN     "daysOff" INTEGER NOT NULL DEFAULT 0;
