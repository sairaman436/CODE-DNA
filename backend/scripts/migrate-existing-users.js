const { PrismaClient } = require('../node_modules/@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  console.log("🔍 Scanning users in database for missing GitHub links...");
  const users = await prisma.user.findMany({
    where: {
      github_id: null
    }
  });

  console.log(`Found ${users.length} users with missing GitHub links.`);

  for (const user of users) {
    // Skip internal mock emails if any
    if (user.email.endsWith('@codedna') || !user.email.includes('@')) {
      continue;
    }

    console.log(`\nChecking email: ${user.email} (User: ${user.display_name}) on GitHub...`);
    try {
      const searchUrl = `https://api.github.com/search/users?q=${encodeURIComponent(user.email)}+in:email`;
      const headers = { 'User-Agent': 'Code-DNA-App' };
      
      if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
        const credentials = Buffer.from(`${process.env.GITHUB_CLIENT_ID}:${process.env.GITHUB_CLIENT_SECRET}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
      } else if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
      }

      const gitCheck = await fetch(searchUrl, { headers });
      if (gitCheck.ok) {
        const gitData = await gitCheck.json();
        if (gitData.total_count > 0) {
          const matchedUser = gitData.items[0];
          console.log(`✅ MATCH FOUND! GitHub Username: ${matchedUser.login}, GitHub ID: ${matchedUser.id}`);
          
          await prisma.user.update({
            where: { id: user.id },
            data: {
              github_username: matchedUser.login,
              github_id: matchedUser.id.toString(),
              avatar_url: matchedUser.avatar_url,
              // Update codedna_username to their GitHub username if they don't have one
              codedna_username: user.codedna_username || matchedUser.login
            }
          });
          console.log(`✨ Successfully linked ${user.email} to GitHub!`);
        } else {
          console.log(`❌ No GitHub account found associated with email ${user.email}`);
        }
      } else {
        const errText = await gitCheck.text();
        console.error(`⚠️ GitHub query failed: ${errText}`);
      }
    } catch (err) {
      console.error(`⚠️ Error querying GitHub for ${user.email}:`, err.message);
    }
  }
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
