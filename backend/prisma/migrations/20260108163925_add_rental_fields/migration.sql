-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "isRecurring" BOOLEAN DEFAULT false;
ALTER TABLE "transactions" ADD COLUMN "lastPaymentDate" DATETIME;
ALTER TABLE "transactions" ADD COLUMN "nextPaymentDate" DATETIME;
ALTER TABLE "transactions" ADD COLUMN "paymentDueDate" DATETIME;
ALTER TABLE "transactions" ADD COLUMN "paymentPeriod" TEXT;
