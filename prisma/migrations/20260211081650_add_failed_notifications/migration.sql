-- CreateTable
CREATE TABLE "failed_notifications" (
    "id" TEXT NOT NULL,
    "receiver" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "error" TEXT,
    "failedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retried" BOOLEAN NOT NULL DEFAULT false,
    "retriedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "failed_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "failed_notifications_receiver_idx" ON "failed_notifications"("receiver");

-- CreateIndex
CREATE INDEX "failed_notifications_failedAt_idx" ON "failed_notifications"("failedAt");

-- CreateIndex
CREATE INDEX "failed_notifications_retried_idx" ON "failed_notifications"("retried");
