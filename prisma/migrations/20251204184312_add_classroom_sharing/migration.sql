/*
  Warnings:

  - A unique constraint covering the columns `[shareToken]` on the table `Classroom` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Classroom" ADD COLUMN     "shareEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Classroom_shareToken_key" ON "Classroom"("shareToken");
