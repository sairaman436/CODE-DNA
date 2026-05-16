import { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's postal address. */
      id: string;
      role: string;
      codedna_username?: string;
      githubId?: string;
      githubLogin?: string;
      status?: string;
    } & DefaultSession["user"]
    githubId?: string;
    githubLogin?: string;
    codedna_username?: string;
    role: string;
    status?: string;
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** OpenID ID Token */
    idToken?: string;
    githubId?: string;
    githubLogin?: string;
    codedna_username?: string;
    role?: string;
    status?: string;
    avatarUrl?: string;
    accessToken?: string;
  }
}
