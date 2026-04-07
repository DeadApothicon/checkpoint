import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Header } from "@/app/ui/header";
import { TicketQueue } from "@/app/ui/ticket-queue";
import { mockTickets } from "@/app/ui/mock-tickets";

export default async function QueuePage() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email ?? "";

  return (
    <div className="flex flex-col min-h-screen bg-brand-offwhite">
      <Header userEmail={userEmail} unreadCount={mockTickets.length} />
      <TicketQueue tickets={mockTickets} />
    </div>
  );
}
