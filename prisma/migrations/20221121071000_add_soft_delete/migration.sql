/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "deletedAt",
DROP COLUMN "isDeleted",
ADD COLUMN     "deleted" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Users" DROP COLUMN "deletedAt",
DROP COLUMN "isDeleted",
ADD COLUMN     "deleted" TIMESTAMP(3);
