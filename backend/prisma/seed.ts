import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const RESOURCES = [
  'organization',
  'member',
  'invitation',
  'role',
  'permission',
  'application',
  'apikey',
  'enduser',
  'enduser_session',
  'audit',
  'app_role',
  'app_permission',
  'session',
];

const ACTIONS = ['create', 'read', 'update', 'delete', 'manage'];

async function main() {
  console.log('Seeding permissions...');

  const permissionsToSeed: any[] = [];
  let sortOrder = 0;

  for (const resource of RESOURCES) {
    for (const action of ACTIONS) {
      sortOrder++;
      permissionsToSeed.push({
        key: `${resource}.${action}`,
        name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource.replace('_', ' ')}`,
        category: resource.charAt(0).toUpperCase() + resource.slice(1).replace('_', ' '),
        description: `Allows to ${action} ${resource.replace('_', ' ')}`,
        sortOrder,
      });
    }
  }

  // Also add some specific custom permissions
  const extraPermissions = [
    { key: 'role.assign', name: 'Assign Role', category: 'Role', description: 'Assign roles to members', sortOrder: ++sortOrder },
    { key: 'app_role.assign', name: 'Assign App Role', category: 'App role', description: 'Assign application roles', sortOrder: ++sortOrder },
    { key: 'member.suspend', name: 'Suspend Member', category: 'Member', description: 'Suspend organization member', sortOrder: ++sortOrder },
    { key: 'member.invite', name: 'Invite Member', category: 'Member', description: 'Invite member to organization', sortOrder: ++sortOrder },
  ];

  const allPermissions = [...permissionsToSeed, ...extraPermissions];

  for (const perm of allPermissions) {
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

  console.log(`Seeded ${allPermissions.length} permissions.`);

  console.log('Seeding System Organization and Owner Role...');
  const systemOrg = await prisma.organization.upsert({
    where: { slug: 'system' },
    update: {},
    create: {
      name: 'System',
      slug: 'system',
    }
  });

  const ownerRole = await prisma.role.upsert({
    where: { 
      organizationId_name: { organizationId: systemOrg.id, name: 'Owner' } 
    },
    update: {},
    create: {
      organizationId: systemOrg.id,
      name: 'Owner',
      description: 'System Owner Role',
      isSystemRole: true,
    }
  });

  const allPermsFromDb = await prisma.permission.findMany();
  for (const perm of allPermsFromDb) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: ownerRole.id,
          permissionId: perm.id
        }
      },
      update: {},
      create: {
        roleId: ownerRole.id,
        permissionId: perm.id
      }
    });
  }
  
  console.log('Assigned all permissions to Owner Role.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
