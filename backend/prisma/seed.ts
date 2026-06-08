import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PERMISSION_CATALOG = [
  // --- Management Permissions (Shown in UI Checklist) ---
  { key: 'role.handle', name: 'Handle Roles', category: 'Workspace', description: 'Create, update, and delete organization roles', sortOrder: 10 },
  { key: 'organization.handle', name: 'Handle Organization', category: 'Workspace', description: 'Update organization details or delete organization', sortOrder: 20 },
  { key: 'member.handle', name: 'Handle Members', category: 'Workspace', description: 'Invite, remove, or manage organization members', sortOrder: 30 },
  { key: 'application.handle', name: 'Handle Applications', category: 'Workspace', description: 'Create, update, and delete applications', sortOrder: 40 },
  { key: 'apikey.handle', name: 'Handle API Key', category: 'Workspace', description: 'Create and revoke API keys', sortOrder: 50 },
  { key: 'app_role.handle', name: 'Handle App Roles', category: 'Workspace', description: 'Manage roles and assignments within applications', sortOrder: 60 },
  { key: 'end_user.handle', name: 'Handle End User', category: 'Workspace', description: 'Manage application end users', sortOrder: 70 },
  { key: 'audit.view', name: 'Handle Audit logs', category: 'Workspace', description: 'View organization and application audit logs', sortOrder: 80 },
  { key: 'session.handle', name: 'Session management', category: 'Workspace', description: 'Manage member sessions (give/remove)', sortOrder: 90 },
  { key: 'auth.handle', name: 'Login logout', category: 'Workspace', description: 'Manage authentication and login/logout permissions', sortOrder: 100 },

  // --- System/View Permissions (Internal/Automatic) ---
  { key: 'organization.view', name: 'View Organization', category: 'System', description: 'View organization details', sortOrder: 101 },
  { key: 'member.view', name: 'View Members', category: 'System', description: 'View organization members', sortOrder: 102 },
  { key: 'role.view', name: 'View Roles', category: 'System', description: 'View organization roles', sortOrder: 103 },
  { key: 'application.view', name: 'View Applications', category: 'System', description: 'View organization applications', sortOrder: 104 },
  { key: 'apikey.view', name: 'View API Keys', category: 'System', description: 'View application API keys', sortOrder: 105 },
  { key: 'app_role.view', name: 'View App Roles', category: 'System', description: 'View roles within applications', sortOrder: 106 },
  { key: 'permission.read', name: 'View Permissions', category: 'System', description: 'View system permissions', sortOrder: 107 },
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

  const allPermissions = await prisma.permission.findMany();
  const viewPermissionKeys = [
    'organization.view',
    'member.view',
    'role.view',
    'application.view',
    'apikey.view',
    'app_role.view',
    'permission.read'
  ];
  const viewPermissions = allPermissions.filter(p => viewPermissionKeys.includes(p.key));

  console.log('Ensuring all organizations have correct roles and permissions...');
  const organizations = await prisma.organization.findMany({
    include: {
      memberships: true,
    }
  });

  for (const org of organizations) {
    // 1. Ensure "Owner" role exists and has all permissions
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

    // Link all permissions to Owner role
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

    // 2. Ensure "Member" role exists and has view permissions
    const memberRole = await prisma.role.upsert({
      where: {
        organizationId_name: {
          organizationId: org.id,
          name: 'Member',
        },
      },
      update: {
        isSystemRole: true,
        description: 'Standard member with view access',
      },
      create: {
        organizationId: org.id,
        name: 'Member',
        description: 'Standard member with view access',
        isSystemRole: true,
      },
    });

    // Link view permissions to Member role
    for (const perm of viewPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: memberRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: memberRole.id,
          permissionId: perm.id,
        },
      });
    }

    // 3. Assign roles to memberships
    for (const membership of org.memberships) {
      if (membership.isOwner) {
        // Owners get Owner role
        await prisma.memberRole.upsert({
          where: {
            membershipId_roleId: {
              membershipId: membership.id,
              roleId: ownerRole.id,
            }
          },
          update: {},
          create: {
            membershipId: membership.id,
            roleId: ownerRole.id,
          }
        });
      } else {
        // Others get Member role by default if they have no roles
        const existingRoles = await prisma.memberRole.findMany({
          where: { membershipId: membership.id }
        });
        
        if (existingRoles.length === 0) {
          await prisma.memberRole.create({
            data: {
              membershipId: membership.id,
              roleId: memberRole.id,
            }
          });
        }
      }
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
