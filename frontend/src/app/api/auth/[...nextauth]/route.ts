import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"

const handler = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      authorization: { params: { scope: 'read:user user:email public_repo' } },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // Extract the REAL GitHub data — not just name/email
        token.accessToken = account.access_token
        token.githubId = (profile as any).id          // numeric GitHub user ID
        token.githubLogin = (profile as any).login    // actual GitHub username (e.g. "saira")
        token.githubName = (profile as any).name      // display name (e.g. "Saira")
        token.avatarUrl = (profile as any).avatar_url
      }
      return token
    },
    async session({ session, token }) {
      // Expose GitHub data to the frontend session
      (session as any).accessToken = token.accessToken;
      (session as any).githubId = token.githubId;
      (session as any).githubLogin = token.githubLogin;
      if (session.user) {
        session.user.name = token.githubLogin as string; // Use login as name so routes work
        session.user.image = token.avatarUrl as string;
      }
      return session
    }
  }
})

export { handler as GET, handler as POST }
