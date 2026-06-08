import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PERMISSION_CATALOG = [
  // Application Management
  { key: 'application.handle', name: 'Handle Applications', category: 'Applications', description: 'Create, update, and delete applications' },
  { key: 'application.view', name: 'View Applications', category: 'Applications', description: 'View application details and list' },

  // Role Management
  { key: 'role.handle', name: 'Handle Roles', category: 'Roles', description: 'Create, update, and delete organization roles' },
  { key: 'role.view', name: 'View Roles', category: 'Roles', description: 'View organization roles and permissions' },

  // API Key Management
  { key: 'apikey.handle', name: 'Handle API Keys', category: 'API Keys', description: 'Create and revoke API keys' },

  // End User Management
  { key: 'end_user.handle', name: 'Handle End Users', category: 'End Users', description: 'Create, update, and delete end users' },

  // Application Role Management (for End Users)
  { key: 'app_role.handle', name: 'Handle App Roles', category: 'Application Roles', description: 'Manage roles and assignments within applications' },

  // Audit Logs
  { key: 'audit.view', name: 'View Audit Logs', category: 'Audit Logs', description: 'View organization and application audit logs' },

  // Session Management
  { key: 'session.handle', name: 'Handle Sessions', category: 'Sessions', description: 'Manage and revoke active sessions' },
];

async function main() {
  console.log('Cleaning up existing permissions...');
  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});

  console.log('Seeding permissions from catalog...');

  for (const perm of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {
        name: perm.name,
        category: perm.category,
        description: perm.description,
      },
      create: perm,
    });
  }

  console.log(`Seeded ${PERMISSION_CATALOG.length} permissions.`);

  console.log('Fixing organization owner memberships...');
  const organizations = await prisma.organization.findMany();
  for (const org of organizations) {
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
  console.log('Fixed owner memberships.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
