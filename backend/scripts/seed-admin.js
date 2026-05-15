const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@codedna.dev';
  const adminPassword = 'sairamanladi2007@gmail.com'; 
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
      password: hashedPassword,
      email_verified: true,
      display_name: 'Master Admin'
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      email_verified: true,
      display_name: 'Master Admin',
      phone_number: '0000000000',
      country_code: '+00'
    }
  });

  console.log('=========================================');
  console.log('🚀 MASTER ADMIN CREATED/UPDATED');
  console.log(`📧 Email: ${adminEmail}`);
  console.log(`🔑 Password: ${adminPassword}`);
  console.log('=========================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
