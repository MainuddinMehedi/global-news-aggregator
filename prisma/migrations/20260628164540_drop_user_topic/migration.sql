/*
  Warnings:

  - You are about to drop the `UserTopic` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `userId` on table `LockedTopic` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "UserTopic" DROP CONSTRAINT "UserTopic_articleId_fkey";

-- DropForeignKey
ALTER TABLE "UserTopic" DROP CONSTRAINT "UserTopic_userId_fkey";

-- AlterTable
ALTER TABLE "LockedTopic" ALTER COLUMN "userId" SET NOT NULL;

-- DropTable
DROP TABLE "UserTopic";

-- AddForeignKey
ALTER TABLE "LockedTopic" ADD CONSTRAINT "LockedTopic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
