-- CreateIndex
CREATE INDEX "ClassSession_startTime_idx" ON "ClassSession"("startTime");

-- CreateIndex
CREATE INDEX "ClassSession_teacherId_idx" ON "ClassSession"("teacherId");

-- CreateIndex
CREATE INDEX "ClassSession_classroomId_idx" ON "ClassSession"("classroomId");
