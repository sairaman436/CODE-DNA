const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Deleting all users except masteradmin.dev@codedna...");
  const result = await prisma.user.deleteMany({
    where: {
      email: {
        not: 'masteradmin.dev@codedna'
      }
    }
  });
  console.log(`Deleted ${result.count} users.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
