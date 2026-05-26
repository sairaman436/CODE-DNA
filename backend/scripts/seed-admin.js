const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

module.exports = async function seedAdmin() {
  const isProduction = process.env.NODE_ENV === 'production';
  const adminEmail = process.env.MASTER_ADMIN_EMAIL || 'sairamanladi2007@gmail.com';
  const adminPassword = process.env.MASTER_ADMIN_PASSWORD || 'sairamanladi2007@gmail.com';

  if (!adminEmail || !adminPassword) {
    console.log('MASTER_ADMIN_EMAIL or MASTER_ADMIN_PASSWORD missing; skipping master admin seed.');
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
      password: hashedPassword,
      email_verified: true,
      display_name: 'Master Admin',
      codedna_username: 'masteradmin',
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      email_verified: true,
      display_name: 'Master Admin',
      phone_number: '0000000000',
      country_code: '+00',
      codedna_username: 'masteradmin',
    },
  });

  console.log('=========================================');
  console.log('MASTER ADMIN CREATED/UPDATED');
  console.log(`Email: ${adminEmail}`);
  console.log(`User ID: ${admin.id}`);
  console.log('=========================================');
}

if (require.main === module) {
  module.exports()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
