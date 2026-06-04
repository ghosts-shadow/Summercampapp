import { ZodError } from "zod";
import { AuthorizationError } from "@/lib/session";

export type FieldErrors = Record<string, string[] | undefined>;

export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

export function ok<T>(data?: T, message?: string): ActionResult<T> {
  return { ok: true, data, message };
}

export function fail(error: string, fieldErrors?: FieldErrors): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/** Convert a Zod error into a structured action failure. */
export function zodFail(err: ZodError): ActionResult<never> {
  return {
    ok: false,
    error: "Please correct the highlighted fields.",
    fieldErrors: err.flatten().fieldErrors,
  };
}

/** Normalize any thrown error into an ActionResult. */
export function handleActionError(e: unknown): ActionResult<never> {
  if (e instanceof AuthorizationError) return fail(e.message);
  if (e instanceof ZodError) return zodFail(e);

  // Prisma unique-constraint violation.
  if (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "P2002"
  ) {
    return fail("A record with those details already exists.");
  }

  console.error("[action] unexpected error:", e);
  return fail("Something went wrong. Please try again.");
}
