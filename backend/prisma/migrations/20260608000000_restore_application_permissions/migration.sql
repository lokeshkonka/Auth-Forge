-- CreateTable
CREATE TABLE "ApplicationPermission" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationRolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationRolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationPermission_applicationId_key_key" ON "ApplicationPermission"("applicationId", "key");

-- AddForeignKey
ALTER TABLE "ApplicationPermission" ADD CONSTRAINT "ApplicationPermission_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationRolePermission" ADD CONSTRAINT "ApplicationRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "ApplicationRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationRolePermission" ADD CONSTRAINT "ApplicationRolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "ApplicationPermission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
