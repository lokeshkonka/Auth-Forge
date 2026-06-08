import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PERMISSION_CATALOG = [
  // Organization Management
  { key: 'organization.handle', name: 'Handle Organization', category: 'Organization', description: 'Update organization details or delete organization', sortOrder: 1 },
  
  // Member Management
  { key: 'member.handle', name: 'Handle Members', category: 'Members', description: 'Invite, remove, or suspend organization members', sortOrder: 10 },
  
  // Role & Permission Management
  { key: 'role.handle', name: 'Handle Roles', category: 'Roles', description: 'Create, update, and delete organization roles', sortOrder: 20 },
  { key: 'permission.handle', name: 'Handle Permissions', category: 'Permissions', description: 'Manage system-wide permissions', sortOrder: 25 },

  // Application Management
  { key: 'application.handle', name: 'Handle Applications', category: 'Applications', description: 'Create, update, and delete applications', sortOrder: 30 },
  { key: 'app_role.handle', name: 'Handle App Roles', category: 'Application Roles', description: 'Manage roles and assignments within applications', sortOrder: 35 },
  { key: 'app_permission.handle', name: 'Handle App Permissions', category: 'Application Permissions', description: 'Manage permissions within applications', sortOrder: 36 },

  // API Key Management
  { key: 'apikey.handle', name: 'Handle API Keys', category: 'API Keys', description: 'Create and revoke API keys', sortOrder: 40 },

  // Audit Logs
  { key: 'audit.view', name: 'View Audit Logs', category: 'Audit Logs', description: 'View organization and application audit logs', sortOrder: 50 },
  
  // End User Management (Legacy/Internal)
  { key: 'end_user.handle', name: 'Handle End Users', category: 'End Users', description: 'Manage application end users', sortOrder: 60 },
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

  // Ensure read/view permissions also exist for granular control
  const viewPermissions = [
    { key: 'organization.view', name: 'View Organization', category: 'Organization', sortOrder: 2 },
    { key: 'member.view', name: 'View Members', category: 'Members', sortOrder: 11 },
    { key: 'role.view', name: 'View Roles', category: 'Roles', sortOrder: 21 },
    { key: 'permission.read', name: 'View Permissions', category: 'Permissions', sortOrder: 26 },
    { key: 'application.view', name: 'View Applications', category: 'Applications', sortOrder: 31 },
    { key: 'session.handle', name: 'Handle Sessions', category: 'Sessions', sortOrder: 80 },
  ];

  for (const perm of viewPermissions) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {
        name: perm.name,
        category: perm.category,
        sortOrder: perm.sortOrder,
      },
      create: { ...perm, description: `Grants ability to ${perm.name.toLowerCase()}` },
    });
  }

  console.log(`Upserted ${PERMISSION_CATALOG.length + viewPermissions.length} permissions.`);

  console.log('Ensuring all organizations have correct owner memberships and full access roles...');
  const organizations = await prisma.organization.findMany({
    include: {
      memberships: true,
    }
  });
  const allPermissions = await prisma.permission.findMany();

  for (const org of organizations) {
    // 1. Fix isOwner flag on membership
    // If org has an ownerId but the membership doesn't have isOwner=true, fix it
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
    } else if (org.memberships.length > 0) {
      // If org has no ownerId but has members, pick the first member as owner
      const firstMember = org.memberships[0];
      await prisma.organization.update({
        where: { id: org.id },
        data: { ownerId: firstMember.memberId },
      });
      await prisma.membership.update({
        where: { id: firstMember.id },
        data: { isOwner: true },
      });
      console.log(`Assigned first member ${firstMember.memberId} as owner for organization ${org.name}`);
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
        description: 'Full administrative access',
      },
      create: {
        organizationId: org.id,
        name: 'Owner',
        description: 'Full administrative access',
        isSystemRole: true,
      },
    });

    // 3. Link all permissions to Owner role
    const currentPermissions = await prisma.rolePermission.findMany({
      where: { roleId: ownerRole.id },
    });
    
    const currentPermissionIds = new Set(currentPermissions.map(cp => cp.permissionId));
    
    for (const perm of allPermissions) {
      if (!currentPermissionIds.has(perm.id)) {
        await prisma.rolePermission.create({
          data: {
            roleId: ownerRole.id,
            permissionId: perm.id,
          },
        });
      }
    }

    // 4. Ensure the owner actually HAS the Owner role
    const ownerMembership = await prisma.membership.findFirst({
      where: {
        organizationId: org.id,
        isOwner: true,
      }
    });

    if (ownerMembership) {
      await prisma.memberRole.upsert({
        where: {
          membershipId_roleId: {
            membershipId: ownerMembership.id,
            roleId: ownerRole.id,
          }
        },
        update: {},
        create: {
          membershipId: ownerMembership.id,
          roleId: ownerRole.id,
        }
      });
    }
  }

  console.log(`Synced permissions and roles for ${organizations.length} organizations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
