import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PERMISSION_CATALOG = [
  // Organization Management
  { key: 'organization.handle', name: 'Handle Organization', category: 'Organization', description: 'Update or delete organization details', sortOrder: 1 },
  { key: 'organization.view', name: 'View Organization', category: 'Organization', description: 'View organization details', sortOrder: 2 },

  // Member Management
  { key: 'member.handle', name: 'Handle Members', category: 'Members', description: 'Invite, remove, or suspend members', sortOrder: 10 },
  { key: 'member.view', name: 'View Members', category: 'Members', description: 'View organization members', sortOrder: 11 },

  // Role Management
  { key: 'role.handle', name: 'Handle Roles', category: 'Roles', description: 'Create, update, and delete organization roles', sortOrder: 20 },
  { key: 'role.view', name: 'View Roles', category: 'Roles', description: 'View organization roles and permissions', sortOrder: 21 },
  { key: 'role.assigned', name: 'Assign Roles', category: 'Roles', description: 'Assign roles to members', sortOrder: 22 },

  // Permission Management
  { key: 'permission.handle', name: 'Handle Permissions', category: 'Permissions', description: 'Manage system-wide permissions', sortOrder: 25 },
  { key: 'permission.read', name: 'View Permissions', category: 'Permissions', description: 'View available permissions', sortOrder: 26 },

  // Application Management
  { key: 'application.handle', name: 'Handle Applications', category: 'Applications', description: 'Create, update, and delete applications', sortOrder: 30 },
  { key: 'application.view', name: 'View Applications', category: 'Applications', description: 'View application details and list', sortOrder: 31 },
  
  // Application Permission Management
  { key: 'app_permission.handle', name: 'Handle App Permissions', category: 'Application Permissions', description: 'Manage permissions within applications', sortOrder: 35 },

  // API Key Management
  { key: 'apikey.handle', name: 'Handle API Keys', category: 'API Keys', description: 'Create and revoke API keys', sortOrder: 40 },

  // End User Management
  { key: 'end_user.handle', name: 'Handle End Users', category: 'End Users', description: 'Create, update, and delete end users', sortOrder: 50 },

  // Application Role Management (for End Users)
  { key: 'app_role.handle', name: 'Handle App Roles', category: 'Application Roles', description: 'Manage roles and assignments within applications', sortOrder: 60 },

  // Audit Logs
  { key: 'audit.view', name: 'View Audit Logs', category: 'Audit Logs', description: 'View organization and application audit logs', sortOrder: 70 },

  // Session Management
  { key: 'session.handle', name: 'Handle Sessions', category: 'Sessions', description: 'Manage and revoke active sessions', sortOrder: 80 },
];

async function main() {
  console.log('Seeding permissions from catalog...');

  for (const perm of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {
        name: perm.name,
        category: perm.category,
        description: perm.description,
        sortOrder: perm.sortOrder,
      },
      create: perm,
    });
  }

  console.log(`Upserted ${PERMISSION_CATALOG.length} permissions.`);

  // Legacy/Alternate keys for compatibility (upsert these too but don't delete)
  const legacyKeys = [
    { key: 'organization.updated', name: 'Update Organization', category: 'Organization' },
    { key: 'organization.deleted', name: 'Delete Organization', category: 'Organization' },
    { key: 'member.invited', name: 'Invite Members', category: 'Members' },
    { key: 'member.removed', name: 'Remove Members', category: 'Members' },
    { key: 'member.suspended', name: 'Suspend Members', category: 'Members' },
    { key: 'application.updated', name: 'Update Applications', category: 'Applications' },
  ];

  for (const legacy of legacyKeys) {
    await prisma.permission.upsert({
      where: { key: legacy.key },
      update: {},
      create: {
        ...legacy,
        description: `Legacy permission for ${legacy.name}`,
        sortOrder: 100,
      },
    });
  }

  console.log('Ensuring all organizations have correct owner memberships and full access roles...');
  const organizations = await prisma.organization.findMany();
  const allPermissions = await prisma.permission.findMany();

  for (const org of organizations) {
    // 1. Fix isOwner flag on membership
    if (org.ownerId) {
      await prisma.membership.updateMany({
        where: {
          organizationId: org.id,
          memberId: org.ownerId,
        },
        data: {
          isOwner: true,
        },
      });
    }

    // 2. Ensure "Owner" role exists and has all permissions
    const ownerRole = await prisma.role.upsert({
      where: {
        organizationId_name: {
          organizationId: org.id,
          name: 'Owner',
        },
      },
      update: {
        isSystemRole: true,
        description: 'Full access to the organization',
      },
      create: {
        organizationId: org.id,
        name: 'Owner',
        description: 'Full access to the organization',
        isSystemRole: true,
      },
    });

    // 3. Link all permissions to Owner role
    for (const perm of allPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: ownerRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: ownerRole.id,
          permissionId: perm.id,
        },
      });
    }
  }

  console.log(`Synced permissions for ${organizations.length} organizations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
