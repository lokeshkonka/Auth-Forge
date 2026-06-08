import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PERMISSION_CATALOG = [
  // Organization Management
  { key: 'organization.updated', name: 'Update Organization', category: 'Organization', description: 'Update organization details', sortOrder: 1 },
  { key: 'organization.deleted', name: 'Delete Organization', category: 'Organization', description: 'Delete the entire organization', sortOrder: 2 },

  // Member Management
  { key: 'member.invited', name: 'Invite Members', category: 'Members', description: 'Invite new members to the organization', sortOrder: 10 },
  { key: 'member.removed', name: 'Remove Members', category: 'Members', description: 'Remove members from the organization', sortOrder: 11 },
  { key: 'member.suspended', name: 'Suspend Members', category: 'Members', description: 'Suspend or activate members', sortOrder: 12 },

  // Role & Permission Management
  { key: 'role.handle', name: 'Handle Roles', category: 'Roles', description: 'Create, update, and delete organization roles', sortOrder: 20 },
  { key: 'role.view', name: 'View Roles', category: 'Roles', description: 'View organization roles and permissions', sortOrder: 21 },
  { key: 'role.assigned', name: 'Assign Roles', category: 'Roles', description: 'Assign roles to members', sortOrder: 22 },
  { key: 'permission.read', name: 'View Permissions', category: 'Roles', description: 'View available permissions', sortOrder: 23 },

  // Application Management
  { key: 'application.handle', name: 'Handle Applications', category: 'Applications', description: 'Create, update, and delete applications', sortOrder: 30 },
  { key: 'application.view', name: 'View Applications', category: 'Applications', description: 'View application details and list', sortOrder: 31 },
  { key: 'application.updated', name: 'Update Applications', category: 'Applications', description: 'Update application settings and permissions', sortOrder: 32 },

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
