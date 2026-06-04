import type { Metadata } from "next";
import Link from "next/link";
import { Tent } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { CAMP } from "@/lib/constants";

export const metadata: Metadata = { title: "Sign In" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow">
            <Tent className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold">{CAMP.name}</h1>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in to the staff &amp; admin portal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LoginForm callbackUrl={callbackUrl} />

            <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Demo credentials</p>
              <p className="mt-1">
                Admin: <code>admin@stjosephscamp.org</code> /{" "}
                <code>ChangeMe123!</code>
              </p>
              <p>
                Staff: <code>sarah.mitchell@stjosephscamp.org</code> /{" "}
                <code>Staff123!</code>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/leaderboard" className="hover:text-foreground hover:underline">
            View the public leaderboard →
          </Link>
        </p>
      </div>
    </div>
  );
}
