import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      authorization: { params: { scope: 'read:user user:email public_repo' } },
    }),
    CredentialsProvider({
      id: "otp",
      name: "OTP",
      credentials: {
        email: { label: "Email", type: "text" },
        user: { label: "User JSON", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.user) return null;
        try {
          const user = JSON.parse(credentials.user);
          return user;
        } catch {
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account && profile && account.provider === 'github') {
        token.accessToken = account.access_token;
        token.githubId = (profile as any).id;
        token.githubLogin = (profile as any).login;
        token.avatarUrl = (profile as any).avatar_url;
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        
        // Link GitHub to an existing Email session if it exists
        if (token.email) {
          try {
            await fetch(`${apiUrl}/api/auth/link-github`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: token.email,
                github_id: token.githubId.toString(),
                github_username: token.githubLogin,
                avatar_url: token.avatarUrl
              })
            });
          } catch (e) {
            console.error("Error linking GitHub:", e);
          }
        }
        
        // Fetch user metadata
        try {
          const res = await fetch(`${apiUrl}/api/profile/${token.githubLogin}`);
          const data = await res.json();
          if (data && data.user) {
            token.codedna_username = data.user.codedna_username;
            token.email = data.user.email || token.email;
            token.role = data.user.role; // Capture role from DB
          }
        } catch (e) {
          console.error("Error fetching profile metadata:", e);
        }
      }
      
      if (user) {
        token.role = (user as any).role || token.role;
        token.codedna_username = (user as any).codedna_username || token.codedna_username;
        token.email = (user as any).email || token.email;
        console.log("JWT CALLBACK [USER]:", { role: token.role, email: token.email });
      }
      
      console.log("JWT CALLBACK [FINAL]:", { role: token.role });
      return token
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).githubId = token.githubId;
      (session as any).githubLogin = token.githubLogin;
      (session as any).codedna_username = token.codedna_username;
      (session as any).role = token.role;
      
      console.log("SESSION CALLBACK:", { role: (session as any).role });
      if (session.user) {
        (session.user as any).id = token.sub;
        // Prefer custom username if available
        session.user.name = (token.codedna_username || token.githubLogin || session.user.name) as string;
        session.user.image = (token.avatarUrl || session.user.image) as string;
        session.user.email = (token.email || session.user.email) as string;
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  }
})

export { handler as GET, handler as POST }
