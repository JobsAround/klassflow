-- AlterTable
ALTER TABLE "ClassSession" ADD COLUMN     "pin" TEXT,
ADD COLUMN     "teacherSignature" TEXT;

-- AlterTable
ALTER TABLE "Classroom" ADD COLUMN     "signatureEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "SignatureToken" ADD COLUMN     "emailSentAt" TIMESTAMP(3);
