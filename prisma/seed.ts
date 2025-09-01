import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
async function main() {
  // ROLE
  const validateRole = await prisma.role.findFirst({
    where: {
      name: 'superadmin',
    },
  });
  let role = null;
  if (!validateRole) {
    role = await prisma.role.create({
      data: {
        name: 'superadmin',
      },
    });
  } else {
    role = validateRole;
  }

  // USER
  const validateSuperAdmin = await prisma.user.findFirst({
    where: {
      type: 'superadmin',
    },
  });
  if (!validateSuperAdmin) {
    await prisma.user.create({
      data: {
        email: 'superadmin@gmail.com',
        password: await bcrypt.hash('password', 10),
        roleId: role.id,
        type: 'superadmin',
      },
    });
  }
  const validateAdmin = await prisma.user.findFirst({
    where: {
      type: 'admin',
    },
  });
  if (!validateAdmin) {
    await prisma.user.create({
      data: {
        email: 'admin@gmail.com',
        password: await bcrypt.hash('password', 10),
        roleId: role.id,
        type: 'admin',
      },
    });
  }

  const seeder = [
    {
      deviceImei: '353201358417886',
      licensePlate: 'B-1234-AA',
      name: 'BMP-886',
    },
    {
      deviceImei: '353201358417654',
      licensePlate: 'B-1234-BB',
      name: 'BMP-654',
    },
  ];
  for (let index = 0; index < seeder.length; index++) {
    const validateVehicle = await prisma.vehicle.findFirst({
      where: {
        deviceImei: seeder[index].deviceImei,
      },
    });
    if (!validateVehicle) {
      await prisma.vehicle.create({
        data: {
          deviceImei: seeder[index].deviceImei,
          licensePlate: seeder[index].licensePlate,
          name: seeder[index].name,
        },
      });
    }
  }

  const seederLibrary = [
    {
      code: 'IOT',
      master: 'device',
      values: '1',
      name: 'IoT Module',
      description: 'IoT Module',
      status: 'Active',
    },
    {
      code: 'SPK',
      master: 'device',
      values: '2',
      name: 'Speaker',
      description: 'Speaker',
      status: 'Active',
    },
    {
      code: 'SIT',
      master: 'simcard',
      values: '1',
      name: 'SIM Regular',
      description: 'SIM Regular',
      status: 'Active',
    },
    {
      code: 'SRG',
      master: 'simcard',
      values: '2',
      name: 'SIM IoT',
      description: 'SIM IoT',
      status: 'Active',
    },
    {
      code: 'DSL',
      master: 'vehicle',
      values: '1',
      name: 'Diesel',
      description: 'Diesel',
      status: 'Active',
    },
    {
      code: 'BBG',
      master: 'vehicle',
      values: '2',
      name: 'BBG',
      description: 'CNG',
      status: 'Active',
    },
    {
      code: 'EVB',
      master: 'vehicle',
      values: '3',
      name: 'Electric',
      description: 'Electric Vehicle Bus',
      status: 'Active',
    },
    {
      code: 'LEB',
      master: 'vehicle',
      values: '4',
      name: 'Low Emission',
      description: 'Low Emission',
      status: 'Active',
    },
    {
      code: 'HYB',
      master: 'vehicle',
      values: '5',
      name: 'Hybrid',
      description: 'Hybrid',
      status: 'Active',
    },
    {
      code: 'SMO',
      master: 'driver',
      values: '1',
      name: 'Morning',
      description: '9 hours, 4:00 AM to 1:00 PM',
      status: 'Active',
    },
    {
      code: 'SAF',
      master: 'driver',
      values: '2',
      name: 'Afternoon',
      description: '9 hours, 12:00 PM to 9:00 PM',
      status: 'Active',
    },
    {
      code: 'SNI',
      master: 'driver',
      values: '3',
      name: 'Night',
      description: '9 hours, 8:00 PM to 5:00 AM',
      status: 'Active',
    },
    {
      code: 'BMP',
      master: 'operator',
      values: '1',
      name: 'Bianglala Metropolitan',
      description: 'Bianglala Metropolitan',
      status: 'Active',
    },
    {
      code: 'DMR',
      master: 'operator',
      values: '2',
      name: 'Damri',
      description: 'Damri',
      status: 'Active',
    },
    {
      code: 'MYS',
      master: 'operator',
      values: '3',
      name: 'Mayasari',
      description: 'Mayasari',
      status: 'Active',
    },
    {
      code: 'TJ',
      master: 'operator',
      values: '4',
      name: 'Transjakarta',
      description: 'Transjakarta',
      status: 'Active',
    },
    {
      code: 'TLT',
      master: 'brand',
      values: '1',
      name: 'Teltonika',
      description: 'Teltonika',
      status: 'Active',
    },
    {
      code: 'CCX',
      master: 'brand',
      values: '2',
      name: 'Concox',
      description: 'Concox',
      status: 'Active',
    },
    {
      code: 'RBT',
      master: 'brand',
      values: '3',
      name: 'Robot',
      description: 'Robot',
      status: 'Active',
    },
    {
      code: 'TSL',
      master: 'telco',
      values: '1',
      name: 'Telkomsel',
      description: 'Telkomsel',
      status: 'Active',
    },
    {
      code: 'LFD',
      master: 'telco',
      values: '2',
      name: 'Links Field',
      description: 'Links Field',
      status: 'Active',
    },
    {
      code: 'TSI',
      master: 'telcotype',
      values: '1',
      name: 'IoT Enterprise',
      description: 'IoT Enterprise',
      status: 'Active',
    },
    {
      code: 'TSN',
      master: 'telcotype',
      values: '2',
      name: 'Regular Non-Human',
      description: 'Regular Non-Human',
      status: 'Active',
    },
    {
      code: 'TSH',
      master: 'telcotype',
      values: '3',
      name: 'Regular Human',
      description: 'Regular Human',
      status: 'Active',
    },
    {
      code: 'LSI',
      master: 'telcotype',
      values: '4',
      name: 'IoT Global',
      description: 'IoT Global',
      status: 'Active',
    },
  ];
  for (let index = 0; index < seederLibrary.length; index++) {
    const validateLibrary = await prisma.library.findFirst({
      where: {
        code: seederLibrary[index].code,
      },
    });
    if (!validateLibrary) {
      await prisma.library.create({
        data: {
          code: seederLibrary[index].code,
          master: seederLibrary[index].master,
          values: seederLibrary[index].values,
          name: seederLibrary[index].name,
          description: seederLibrary[index].description,
          status: seederLibrary[index].status,
        },
      });
    }
  }

  const permissionData = [
    // Reporting
    { name: 'view-tripHistory' },
    { name: 'view-deviceLog' },
    { name: 'view-operspeedWarning' },

    // Master Data - Library
    { name: 'view-library' },
    { name: 'create-library' },
    { name: 'edit-library' },
    { name: 'delete-library' },

    // Master Data - Vehicle
    { name: 'view-vehicle' },
    { name: 'create-vehicle' },
    { name: 'edit-vehicle' },
    { name: 'delete-vehicle' },

    // Master Data - Device
    { name: 'view-device' },
    { name: 'create-device' },
    { name: 'edit-device' },
    { name: 'delete-device' },

    // Master Data - SIM Card
    { name: 'view-simCard' },
    { name: 'create-simCard' },
    { name: 'edit-simCard' },
    { name: 'delete-simCard' },

    // Master Data - Driver
    { name: 'view-driver' },
    { name: 'create-driver' },
    { name: 'edit-driver' },
    { name: 'delete-driver' },

    // Master Data - Points
    { name: 'view-point' },
    { name: 'create-point' },
    { name: 'edit-point' },
    { name: 'delete-point' },

    // Master Data - Route
    { name: 'view-route' },
    { name: 'create-route' },
    { name: 'edit-route' },
    { name: 'delete-route' },

    // User Management - User
    { name: 'view-user' },
    { name: 'create-user' },
    { name: 'edit-user' },
    { name: 'delete-user' },

    // User Management - Roles
    { name: 'view-roles' },
    { name: 'create-roles' },
    { name: 'edit-roles' },
    { name: 'delete-roles' },

    // User Management - Permission
    { name: 'view-permission' },
    { name: 'create-permission' },
    { name: 'edit-permission' },
    { name: 'delete-permission' },
  ];

  for (let index = 0; index < permissionData.length; index++) {
    const validateLibrary = await prisma.permission.findFirst({
      where: {
        name: permissionData[index].name,
      },
    });
    if (!validateLibrary) {
      await prisma.permission.create({
        data: {
          name: permissionData[index].name,
        },
      });
    }
  }
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
