-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('ONLINE', 'ONSITE');

-- AlterTable
ALTER TABLE "ClassSession" ADD COLUMN     "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reminderHoursBefore" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "signatureMinutesBefore" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "type" "SessionType" NOT NULL DEFAULT 'ONSITE';
