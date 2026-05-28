const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up mock users from the database...");

  // Find users to delete
  const mockUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { endsWith: '@codedna.dev' } },
        { github_username: null }
      ],
      NOT: {
        email: 'sairamanladi2007@gmail.com' // Keep Master Admin
      }
    }
  });

  console.log(`Found ${mockUsers.length} mock users to delete:`, mockUsers.map(u => u.username || u.email));

  const deleteIds = mockUsers.map(u => u.id);

  if (deleteIds.length > 0) {
    // Prisma will cascade delete fingerprints and activity logs if schema is set,
    // otherwise we delete them manually first.
    const deletedFingerprints = await prisma.fingerprint.deleteMany({
      where: {
        user_id: { in: deleteIds }
      }
    });
    console.log(`Deleted ${deletedFingerprints.count} associated fingerprints.`);

    const deletedLogs = await prisma.activityLog.deleteMany({
      where: {
        user_id: { in: deleteIds }
      }
    });
    console.log(`Deleted ${deletedLogs.count} associated activity logs.`);

    const result = await prisma.user.deleteMany({
      where: {
        id: { in: deleteIds }
      }
    });
    console.log(`Successfully deleted ${result.count} mock users.`);
  } else {
    console.log("No mock users found to delete.");
  }
}

main()
  .catch(e => {
    console.error("Error during cleanup:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
