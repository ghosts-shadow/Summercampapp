import { requireUser } from "@/lib/session";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-dvh bg-muted/30">
      <AppSidebar role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          user={{
            name: user.name ?? "User",
            email: user.email ?? "",
            role: user.role,
          }}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
