-- AlterTable
ALTER TABLE "Ticket" ALTER COLUMN "itPriority" SET DEFAULT '';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;
