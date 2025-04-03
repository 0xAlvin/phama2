import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { verifyUser } from "@/lib/services/userService";
import type { Session } from "next-auth";

// Extend the User interface to include rememberMe property
declare module "next-auth" {
  interface User {
    rememberMe?: boolean;
    image?: string | null;
    profileUrl?: string | null;
  }
  
  interface Session {
    user: {
      id?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      rememberMe?: boolean;
      profileUrl?: string | null;
      role?: string | null;
    };
    expires: string;
  }
}
 
export const BASE_PATH = "/api/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Credentials(
      {
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
          remember: { label: "Remember Me", type: "checkbox" }
        },
        async authorize(credentials) {
          // Check if credentials exist and have email
          if (!credentials?.email) return null;
          
          // Fetch user from db
          const user = await verifyUser(credentials.email! as string, credentials.password! as string);
          // Return user if found, null otherwise
          if (user) {
            return {
              id: user.id,
              email: user.email,
              role: user.role || null,
              image: user.profileUrl || null,
              profileUrl: user.profileUrl || null,
              rememberMe: credentials?.remember === 'true',
            };
          }
          return null;
        },
      }
    ),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/signin",
    signOut: "/signout",
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    // Default session duration
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  
  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
  
  // Standardize on the next-auth naming convention for cookies
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: "next-auth.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      }
    },
    csrfToken: {
      name: "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      }
    },
  },
  
  callbacks: {
    authorized: async ({auth}) => {
      return !! auth;
    },
    jwt: ({ token, user, account, trigger, session, profile }: any) => {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.remember = user.rememberMe || false;
        token.role = user.role;
        
        // Handle profile images from different sources
        token.profileUrl = user.profileUrl || null;
        
        // For OAuth providers like Google that provide images
        if (account?.provider === 'google' && profile?.picture) {
          token.image = profile.picture;
        } else {
          token.image = user.image || user.profileUrl || null;
        }
        
        // If remember me was checked, we'll store that in the token
        if (trigger === "update") {
          token.remember = session.user?.rememberMe || false;
        }
        
        // Extend token expiry if remember me is checked
        if (user.rememberMe) {
          token.maxAge = 3 * 24 * 60 * 60; // 3 days
        }
      }
      
      return token;
    },
    session: ({ session, token }: { session: Session; token: any }) => {
      if (token) {
        // Copy user details from token to session
        if (session.user) {
          session.user.id = token.id as string;
          session.user.role = token.role;
          // Add rememberMe to the session user object
          session.user.rememberMe = !!token.remember;
          session.user.profileUrl = token.profileUrl || null;
          session.user.image = token.image || token.profileUrl || null;
        }
      }
      
      return session;
    },
    // Add a redirect callback to validate and handle redirects
    redirect({ url, baseUrl }) {
      console.log('NextAuth redirect callback:', { url, baseUrl });
      
      // Very simple approach:
      // 1. If it's an absolute URL that doesn't start with baseUrl, redirect to dashboard
      // 2. Otherwise use the URL as-is
      
      if (url.startsWith('http') && !url.startsWith(baseUrl)) {
        console.log(`External URL detected, redirecting to dashboard`);
        return `${baseUrl}/dashboard`;
      }
      
      console.log(`Using URL as-is: ${url}`);
      return url;
    }
  },
})