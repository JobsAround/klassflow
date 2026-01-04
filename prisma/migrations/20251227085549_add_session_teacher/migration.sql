/*
  Warnings:

  - The primary key for the `_ClassroomTeachers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_ClassroomTeachers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ClassSession" ADD COLUMN     "teacherId" TEXT;

-- AlterTable
ALTER TABLE "_ClassroomTeachers" DROP CONSTRAINT "_ClassroomTeachers_AB_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "_ClassroomTeachers_AB_unique" ON "_ClassroomTeachers"("A", "B");

-- AddForeignKey
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
