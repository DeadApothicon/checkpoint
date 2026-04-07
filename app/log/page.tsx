import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Header } from "@/app/ui/header";
import { LogTable } from "@/app/ui/log-table";
import { prisma } from "@/lib/prisma";

export default async function LogPage() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email ?? "";

  const [rawEntries, pendingCount] = await Promise.all([
    prisma.ticket.findMany({
      where: { status: { not: "pending" } },
      orderBy: { actioned_at: "desc" },
    }),
    prisma.ticket.count({ where: { status: "pending" } }),
  ]);

  const entries = rawEntries.map((t) => ({
    ...t,
    status: t.status as "pending" | "approved" | "denied" | "re_prompted",
    created_at: t.created_at.toISOString(),
    actioned_at: t.actioned_at?.toISOString() ?? null,
  }));

  return (
    <div className="flex flex-col min-h-screen bg-brand-offwhite">
      <Header userEmail={userEmail} unreadCount={pendingCount} />
      <div className="px-6 py-4 max-w-5xl mx-auto w-full">
        <h1 className="text-lg font-semibold text-brand-near-black">
          Action Log
        </h1>
      </div>
      <LogTable entries={entries} />
    </div>
  );
}
