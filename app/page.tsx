import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Header } from "@/app/ui/header";
import { TicketQueue } from "@/app/ui/ticket-queue";
import { prisma } from "@/lib/prisma";

export default async function QueuePage() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email ?? "";

  const rawTickets = await prisma.ticket.findMany({
    where: { status: "pending" },
    orderBy: { created_at: "desc" },
  });

  const tickets = rawTickets.map((t) => ({
    ...t,
    status: t.status as "pending" | "approved" | "denied" | "re_prompted",
    created_at: t.created_at.toISOString(),
    actioned_at: t.actioned_at?.toISOString() ?? null,
  }));

  return (
    <div className="flex flex-col min-h-screen bg-brand-offwhite">
      <Header userEmail={userEmail} unreadCount={tickets.length} />
      <TicketQueue tickets={tickets} />
    </div>
  );
}
