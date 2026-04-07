import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Header } from "@/app/ui/header";
import { SettingsPanel } from "@/app/ui/settings-panel";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const [user, pendingCount] = await Promise.all([
    prisma.user.findUnique({
      where: { email: session.user.email },
      select: { email_notifications: true },
    }),
    prisma.ticket.count({ where: { status: "pending" } }),
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-brand-offwhite">
      <Header userEmail={session.user.email} unreadCount={pendingCount} />
      <SettingsPanel emailNotifications={user?.email_notifications ?? true} />
    </div>
  );
}
