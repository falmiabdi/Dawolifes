-- CreateEnum
CREATE TYPE "PermissionType" AS ENUM ('EDIT', 'DELETE');

-- CreateEnum
CREATE TYPE "PermissionStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "PermissionEntityType" AS ENUM ('PROPERTY', 'VEHICLE');

-- CreateTable
CREATE TABLE "permission_requests" (
    "id" UUID NOT NULL,
    "type" "PermissionType" NOT NULL,
    "entityType" "PermissionEntityType" NOT NULL,
    "entityId" UUID NOT NULL,
    "requesterId" UUID NOT NULL,
    "status" "PermissionStatus" NOT NULL DEFAULT 'Pending',
    "reason" TEXT,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMPTZ(3),
    "decidedById" UUID,

    CONSTRAINT "permission_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "permission_requests_entityType_entityId_idx" ON "permission_requests"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "permission_requests_requesterId_idx" ON "permission_requests"("requesterId");

-- CreateIndex
CREATE INDEX "permission_requests_status_idx" ON "permission_requests"("status");

-- AddForeignKey
ALTER TABLE "permission_requests" ADD CONSTRAINT "permission_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_requests" ADD CONSTRAINT "permission_requests_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
