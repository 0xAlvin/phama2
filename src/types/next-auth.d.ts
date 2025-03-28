import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider`.
   */
  interface Session {
    user: {
      /** The user's ID. */
      id: string;
      /** Whether the session was created with "remember me" checked */
      rememberMe?: boolean;
      /** The user's profile URL */
      profileUrl?: string | null;
    } & DefaultSession["user"]
  }

  interface User {
    /** The user's profile URL */
    profileUrl?: string | null;
  }
}
