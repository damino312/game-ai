/*
  Warnings:

  - You are about to drop the `MemoryEvent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MemoryEvent" DROP CONSTRAINT "MemoryEvent_userId_fkey";

-- DropTable
DROP TABLE "MemoryEvent";
