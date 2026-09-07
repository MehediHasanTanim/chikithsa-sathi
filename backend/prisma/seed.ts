import { PrismaClient, type UserRole } from '@prisma/client';

import { PERMISSIONS, ROLE_PERMISSIONS } from '../src/modules/permissions/permissions.constants';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  for (const [code, description] of Object.entries(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: { code },
      update: { description },
      create: { code, description },
    });
  }

  for (const [role, codes] of Object.entries(ROLE_PERMISSIONS) as [UserRole, readonly string[]][]) {
    const roleRecord = await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: { name: role, description: `${role} role`, isSystem: true },
    });

    const permissions = await prisma.permission.findMany({
      where: { code: { in: [...codes] } },
      select: { id: true },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: roleRecord.id } });
    if (permissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId: roleRecord.id,
          permissionId: permission.id,
        })),
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log('Seeded roles and permissions.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    // eslint-disable-next-line no-console
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
