-- AlterTable
ALTER TABLE "users" ADD COLUMN     "gesturePassword" TEXT,
ADD COLUMN     "lastActiveAt" TIMESTAMP(3),
ADD COLUMN     "streakDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "xp" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "translated_documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "translated_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "translated_documents_userId_createdAt_idx" ON "translated_documents"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "translated_documents" ADD CONSTRAINT "translated_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
