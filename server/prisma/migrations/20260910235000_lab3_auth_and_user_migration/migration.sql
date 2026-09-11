-- 1. CreateEnum
CREATE TYPE "Role" AS ENUM ('REQUESTER', 'IT_STAFF', 'ADMINISTRATOR');

-- 2. CreateTable User
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'REQUESTER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- 3. CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- 4. Zero Regression: Migrate existing DevelopmentRequester rows into User
-- Preserving exact IDs, names, emails, and active statuses
-- Setting initial password to 'Toktick2026!' with mustChangePassword = true
INSERT INTO "User" ("id", "name", "email", "isActive", "passwordHash", "role", "mustChangePassword", "createdAt", "updatedAt")
SELECT 
    "id", 
    "name", 
    "email", 
    "isActive", 
    '$2b$10$nBm3SKBJGe5DJ5nBGvGqAuEpk/GWdJzPtlRdxD.zYZ3ys6W/lwPGi', 
    'REQUESTER'::"Role", 
    true, 
    NOW(), 
    NOW()
FROM "DevelopmentRequester"
ON CONFLICT ("id") DO NOTHING;

-- 5. Advance the User_id_seq sequence past the migrated IDs
SELECT setval(pg_get_serial_sequence('"User"', 'id'), coalesce(max(id), 0) + 1, false) FROM "User";

-- 6. Switch Ticket foreign key from DevelopmentRequester to User
ALTER TABLE "Ticket" DROP CONSTRAINT IF EXISTS "Ticket_requesterId_fkey";
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 7. Add columns to Ticket with safe data initialization
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "assignedStaffId" INTEGER;
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "itPriority" TEXT;
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "problemResolvedReported" BOOLEAN NOT NULL DEFAULT false;

-- Copy requestedPriority to itPriority for all existing Lab 2 tickets (BR-14)
UPDATE "Ticket" SET "itPriority" = "requestedPriority" WHERE "itPriority" IS NULL;

-- Enforce NOT NULL on itPriority now that all existing rows are populated
ALTER TABLE "Ticket" ALTER COLUMN "itPriority" SET NOT NULL;

-- Add Foreign Key for assignedStaffId
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 8. Create Comments and InternalNotes tables
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "content" VARCHAR(1000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ticketId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InternalNote" (
    "id" SERIAL NOT NULL,
    "content" VARCHAR(1000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ticketId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,

    CONSTRAINT "InternalNote_pkey" PRIMARY KEY ("id")
);

-- Foreign Keys for Comment and InternalNote
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 9. Drop old DevelopmentRequester table now that data is safely in User
DROP TABLE IF EXISTS "DevelopmentRequester";
