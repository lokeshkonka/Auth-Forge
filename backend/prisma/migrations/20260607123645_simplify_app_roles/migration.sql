/*
  Warnings:

  - You are about to drop the `ApplicationPermission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ApplicationRolePermission` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ApplicationPermission" DROP CONSTRAINT "ApplicationPermission_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "ApplicationRolePermission" DROP CONSTRAINT "ApplicationRolePermission_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "ApplicationRolePermission" DROP CONSTRAINT "ApplicationRolePermission_roleId_fkey";

-- DropTable
DROP TABLE "ApplicationPermission";

-- DropTable
DROP TABLE "ApplicationRolePermission";
