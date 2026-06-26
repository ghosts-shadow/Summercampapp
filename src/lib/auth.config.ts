import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

/**
 * Edge-safe NextAuth configuration.
 *
 * This module is imported by `middleware.ts`, which runs on the Edge runtime
 * and therefore CANNOT import Prisma or bcrypt. The credentials provider that
 * needs those is attached separately in `src/auth.ts` (Node runtime).
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8, // 8 hours
  },
  trustHost: true,
  providers: [], // real providers are added in src/auth.ts
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.name = user.name;
        token.email = user.email;
      }
      // When the user edits their own profile we push the new details into the
      // token via `unstable_update`, so the header reflects them immediately.
      if (trigger === "update" && session) {
        const s = session as {
          name?: string;
          email?: string;
          user?: { name?: string; email?: string };
        };
        const name = s.user?.name ?? s.name;
        const email = s.user?.email ?? s.email;
        if (name) token.name = name;
        if (email) token.email = email;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
