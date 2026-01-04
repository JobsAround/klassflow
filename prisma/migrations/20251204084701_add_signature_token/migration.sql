-- CreateTable
CREATE TABLE "SignatureToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignatureToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SignatureToken_token_key" ON "SignatureToken"("token");

-- CreateIndex
CREATE INDEX "SignatureToken_token_idx" ON "SignatureToken"("token");

-- CreateIndex
CREATE INDEX "SignatureToken_sessionId_studentId_idx" ON "SignatureToken"("sessionId", "studentId");

-- AddForeignKey
ALTER TABLE "SignatureToken" ADD CONSTRAINT "SignatureToken_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureToken" ADD CONSTRAINT "SignatureToken_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
