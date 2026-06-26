import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { ROLE_LABELS } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/profile-form";

export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const me = await requireUser();

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { name: true, email: true, phone: true, role: true },
  });

  if (!user) {
    return (
      <div>
        <PageHeader title="My Profile" />
        <p className="text-sm text-muted-foreground">
          Your account could not be loaded. Try signing out and back in.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="My Profile" description="Manage your account details." />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Account
            <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
          </CardTitle>
          <CardDescription>
            Update your name, email, phone, or password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initial={{
              name: user.name,
              email: user.email,
              phone: user.phone ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
