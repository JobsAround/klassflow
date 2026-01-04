-- CreateTable
CREATE TABLE "ClassroomEnrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassroomEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassroomEnrollment_classroomId_idx" ON "ClassroomEnrollment"("classroomId");

-- CreateIndex
CREATE INDEX "ClassroomEnrollment_studentId_idx" ON "ClassroomEnrollment"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassroomEnrollment_studentId_classroomId_key" ON "ClassroomEnrollment"("studentId", "classroomId");

-- AddForeignKey
ALTER TABLE "ClassroomEnrollment" ADD CONSTRAINT "ClassroomEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomEnrollment" ADD CONSTRAINT "ClassroomEnrollment_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
