/*
  Warnings:

  - You are about to drop the column `keyHash` on the `ApiKey` table. All the data in the column will be lost.
  - Added the required column `publishableKeyHash` to the `ApiKey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `secretKeyHash` to the `ApiKey` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ApiKey" DROP COLUMN "keyHash",
ADD COLUMN     "publishableKeyHash" TEXT NOT NULL,
ADD COLUMN     "secretKeyHash" TEXT NOT NULL;
