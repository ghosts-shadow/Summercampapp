import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/auth";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: Role;
};

/** Returns the current user, or null if signed out. Does not redirect. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  return (session?.user as SessionUser | undefined) ?? null;
}

/** For pages/layouts: require a session or redirect to /login. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** For pages/layouts: require ADMIN or redirect to the dashboard. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== Role.ADMIN) redirect("/dashboard");
  return user;
}

/** Thrown by `authorize()` inside server actions. */
export class AuthorizationError extends Error {
  constructor(message = "You are not authorized to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * For server actions / API routes: assert a session (and optionally one of the
 * given roles). Throws AuthorizationError instead of redirecting so the caller
 * can return a structured error to the client.
 */
export async function authorize(roles?: Role[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthorizationError("You must be signed in.");
  if (roles && !roles.includes(user.role)) {
    throw new AuthorizationError("You do not have permission for this action.");
  }
  return user;
}

export const isAdmin = (user: { role: Role } | null | undefined): boolean =>
  user?.role === Role.ADMIN;
