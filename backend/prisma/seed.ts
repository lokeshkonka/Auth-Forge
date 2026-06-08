import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PERMISSION_CATALOG = [
  // Authentication
  { key: 'customer.signup', name: 'Signup', category: 'Authentication', description: 'Permission to signup' },
  { key: 'customer.login', name: 'Login', category: 'Authentication', description: 'Permission to login' },
  { key: 'customer.logout', name: 'Logout', category: 'Authentication', description: 'Permission to logout' },

  // Organizations
  { key: 'organization.created', name: 'Create Organization', category: 'Organizations', description: 'Permission to create organization' },
  { key: 'organization.updated', name: 'Update Organization', category: 'Organizations', description: 'Permission to update organization' },
  { key: 'organization.deleted', name: 'Delete Organization', category: 'Organizations', description: 'Permission to delete organization' },

  // Members
  { key: 'member.invited', name: 'Invite Member', category: 'Members', description: 'Permission to invite members' },
  { key: 'member.accepted', name: 'Accept Invitation', category: 'Members', description: 'Permission to accept invitations' },
  { key: 'member.suspended', name: 'Suspend Member', category: 'Members', description: 'Permission to suspend members' },
  { key: 'member.removed', name: 'Remove Member', category: 'Members', description: 'Permission to remove members' },

  // Roles
  { key: 'role.created', name: 'Create Role', category: 'Roles', description: 'Permission to create roles' },
  { key: 'role.updated', name: 'Update Role', category: 'Roles', description: 'Permission to update roles' },
  { key: 'role.deleted', name: 'Delete Role', category: 'Roles', description: 'Permission to delete roles' },
  { key: 'role.assigned', name: 'Assign Role', category: 'Roles', description: 'Permission to assign roles' },

  // Applications
  { key: 'application.created', name: 'Create Application', category: 'Applications', description: 'Permission to create applications' },
  { key: 'application.updated', name: 'Update Application', category: 'Applications', description: 'Permission to update applications' },
  { key: 'application.deleted', name: 'Delete Application', category: 'Applications', description: 'Permission to delete applications' },

  // API Keys
  { key: 'apikey.created', name: 'Create API Key', category: 'API Keys', description: 'Permission to create API keys' },
  { key: 'apikey.revoked', name: 'Revoke API Key', category: 'API Keys', description: 'Permission to revoke API keys' },

  // Application Roles
  { key: 'app_role.created', name: 'Create App Role', category: 'Application Roles', description: 'Permission to create application roles' },
  { key: 'app_role.updated', name: 'Update App Role', category: 'Application Roles', description: 'Permission to update application roles' },
  { key: 'app_role.deleted', name: 'Delete App Role', category: 'Application Roles', description: 'Permission to delete application roles' },
  { key: 'app_role.assigned', name: 'Assign App Role', category: 'Application Roles', description: 'Permission to assign application roles' },
  { key: 'app_role.unassigned', name: 'Unassign App Role', category: 'Application Roles', description: 'Permission to unassign application roles' },

  // End Users
  { key: 'end_user.created', name: 'Create End User', category: 'End Users', description: 'Permission to create end users' },
  { key: 'end_user.updated', name: 'Update End User', category: 'End Users', description: 'Permission to update end users' },
  { key: 'end_user.deleted', name: 'Delete End User', category: 'End Users', description: 'Permission to delete end users' },
  { key: 'bulk_import.completed', name: 'Bulk Import', category: 'End Users', description: 'Permission to perform bulk imports' },

  // Audit Logs
  { key: 'audit.read', name: 'Read Audit Logs', category: 'Audit Logs', description: 'Permission to view audit logs' },

  // Permissions
  { key: 'permission.read', name: 'Read Permissions', category: 'Permissions', description: 'Permission to view available permissions' },

  // Sessions
  { key: 'session.revoked', name: 'Revoke Session', category: 'Sessions', description: 'Permission to revoke session' },
  { key: 'session.revoked_all', name: 'Revoke All Sessions', category: 'Sessions', description: 'Permission to revoke all sessions' },
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
