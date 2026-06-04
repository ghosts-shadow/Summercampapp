"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { signIn, signOut } from "@/auth";
import { loginSchema } from "@/lib/validations";
import { ipFromHeaders, rateLimit } from "@/lib/rate-limit";

export type LoginState = { error?: string } | undefined;

/** Only permit same-origin relative callback URLs (prevents open redirects). */
function safeCallback(value: FormDataEntryValue | null): string {
  const url = String(value ?? "");
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  return "/dashboard";
}

export async function authenticate(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { error: "Please enter a valid email and password." };
  }

  // Throttle brute-force attempts per client IP.
  const ip = ipFromHeaders(await headers());
  const limited = rateLimit(`login:${ip}`, 8, 60_000);
  if (!limited.success) {
    return { error: "Too many attempts. Please wait a minute and try again." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: safeCallback(formData.get("callbackUrl")),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    // signIn throws a redirect on success — let Next.js handle it.
    throw error;
  }

  return undefined;
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
