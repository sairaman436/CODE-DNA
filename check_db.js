const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const jobs = await prisma.analysisJob.findMany({ take: 5, orderBy: { created_at: 'desc' } });
  console.log(JSON.stringify(jobs, null, 2));
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
