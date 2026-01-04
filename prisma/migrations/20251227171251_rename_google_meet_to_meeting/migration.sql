/*
  Warnings:

  - You are about to drop the column `googleCalendarEventId` on the `ClassSession` table. All the data in the column will be lost.
  - You are about to drop the column `googleMeetLink` on the `ClassSession` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ClassSession" DROP COLUMN "googleCalendarEventId",
DROP COLUMN "googleMeetLink",
ADD COLUMN     "calendarEventId" TEXT,
ADD COLUMN     "isOnline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "meetingLink" TEXT;
