const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  console.log(JSON.stringify(users, null, 2));

  // Let's also check the fingerprints for the users
  const fingerprints = await prisma.fingerprint.findMany({
    take: 5,
    orderBy: { created_at: 'desc' }
  });
  console.log('FINGERPRINTS:');
  console.log(JSON.stringify(fingerprints, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
