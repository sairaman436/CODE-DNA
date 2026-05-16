import NextAuth, { NextAuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
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
    async signIn({ user, account, profile }) {
      if (account?.provider === 'github' && profile) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const githubId = (profile as any).id?.toString();
        const githubEmail = user.email;
        const githubUsername = (profile as any).login;
        const avatarUrl = (profile as any).avatar_url;

        try {
          const res = await fetch(`${apiUrl}/api/auth/link-github`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: githubEmail,
              github_id: githubId,
              github_username: githubUsername,
              avatar_url: avatarUrl
            })
          });

          if (res.status === 404) {
            // This means the GitHub email isn't in our DB, and the GitHub ID isn't either.
            // Redirect to link mode with the GitHub params
            const params = new URLSearchParams({
              mode: 'link_mismatch',
              gh_id: githubId || '',
              gh_username: githubUsername || '',
              gh_avatar: avatarUrl || ''
            });
            return `/login?${params.toString()}`;
          }
        } catch (e) {
          // If the backend is down, allow it to fall through
        }
      }
      return true;
    },
    async jwt({ token, account, profile, user }) {
      if (account && profile && account.provider === 'github') {
        token.accessToken = account.access_token;
        token.githubId = (profile as any).id;
        token.githubLogin = (profile as any).login;
        token.avatarUrl = (profile as any).avatar_url;
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        
        try {
          const githubRes = await fetch(`${apiUrl}/api/profile/github/${token.githubId}`);
          if (githubRes.ok) {
            const githubData = await githubRes.json();
            if (githubData && githubData.user) {
              token.codedna_username = githubData.user.codedna_username;
              token.email = githubData.user.email || token.email;
              token.role = githubData.user.role;
              token.sub = githubData.user.id;
              token.status = githubData.user.status;
            }
          }
        } catch (e) {
        }
        
        if (!token.codedna_username) {
          try {
            const res = await fetch(`${apiUrl}/api/profile/${token.githubLogin}`);
            const data = await res.json();
            if (data && data.user) {
              token.codedna_username = data.user.codedna_username;
              token.role = data.user.role;
              token.sub = data.user.id;
              token.status = data.user.status;
            }
          } catch (e) {
          }
        }

        // HARD-CODED MASTER ADMIN BYPASS
        if (token.email === "masteradmin.dev@codedna") {
          token.role = "ADMIN";
        }
      }
      
      if (user) {
        token.sub = user.id || token.sub;
        token.role = (user as any).role || token.role;
        token.status = (user as any).status || token.status;
        token.codedna_username = (user as any).codedna_username || token.codedna_username;
        token.email = user.email || token.email;
        
        if (token.email === "masteradmin.dev@codedna") {
          token.role = "ADMIN";
        }
      }
      
      return token
    },
    async session({ session, token }) {
      session.accessToken = (token as any).accessToken;
      session.githubId = token.githubId;
      session.githubLogin = token.githubLogin;
      session.codedna_username = token.codedna_username;
      session.role = token.role as string;
      session.status = token.status as string;
      
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.status = token.status as string;
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
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }
