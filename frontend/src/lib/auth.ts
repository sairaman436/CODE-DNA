import { NextAuthOptions } from "next-auth"
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
              avatar_url: avatarUrl,
              github_token: account.access_token
            })
          });

          if (res.status === 404) {
            // The user's GitHub email isn't in the database.
            // Deny login and redirect with an error.
            return `/login?error=GithubEmailMismatch`;
          }
        } catch (e) {
          // If the backend is down, allow it to fall through
        }
      }
      return true;
    },
    async jwt({ token, account, profile, user, trigger, session }) {
      // Handle session updates from frontend (e.g. updating profile image)
      if (trigger === "update" && session) {
        if (session.image !== undefined) token.avatarUrl = session.image;
        if (session.name !== undefined) token.name = session.name;
      }

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
              token.name = githubData.user.display_name || token.name;
              token.avatarUrl = githubData.user.avatar_url || token.avatarUrl;
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
              token.name = data.user.display_name || token.name;
              token.avatarUrl = data.user.avatar_url || token.avatarUrl;
            }
          } catch (e) {
          }
        }

        // HARD-CODED MASTER ADMIN BYPASS
        if (token.email === "sairamanladi2007@gmail.com") {
          token.role = "ADMIN";
          token.codedna_username = "masteradmin";
          token.name = "Master Admin";
        }
      }

      if (user) {
        token.sub = user.id || token.sub;
        token.role = (user as any).role || token.role;
        token.status = (user as any).status || token.status;
        token.codedna_username = (user as any).codedna_username || token.codedna_username;
        token.email = user.email || token.email;
        token.name = (user as any).name || token.name;
        token.avatarUrl = (user as any).avatar_url || (user as any).image || token.avatarUrl;
        
        token.githubId = (user as any).github_id || token.githubId;
        token.githubLogin = (user as any).github_username || token.githubLogin;
        token.accessToken = (user as any).github_token || token.accessToken;

        if (token.email === "sairamanladi2007@gmail.com") {
          token.role = "ADMIN";
          token.codedna_username = "masteradmin";
          token.name = "Master Admin";
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
        session.user.name = (token.name || token.codedna_username || token.githubLogin || session.user.name) as string;
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
