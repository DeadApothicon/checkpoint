"use client";

import { useState } from "react";
import type { Ticket } from "./mock-tickets";
import { TicketCard } from "./ticket-card";

interface TicketQueueProps {
  tickets: Ticket[];
}

export function TicketQueue({ tickets: initialTickets }: TicketQueueProps) {
  const [tickets, setTickets] = useState(initialTickets);
  const [selectedClient, setSelectedClient] = useState("all");

  const clientIds = Array.from(new Set(tickets.map((t) => t.client_id))).sort();

  const visible =
    selectedClient === "all"
      ? tickets
      : tickets.filter((t) => t.client_id === selectedClient);

  function dismiss(id: string) {
    setTickets((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="flex-1 px-6 py-6 max-w-3xl mx-auto w-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-brand-near-black focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
        >
          <option value="all">All clients</option>
          {clientIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>

        <span className="text-sm text-zinc-500">
          {visible.length === 1
            ? "1 open ticket"
            : `${visible.length} open tickets`}
        </span>
      </div>

      {/* Ticket list */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
            <CheckIcon />
          </div>
          <p className="text-sm font-medium text-brand-near-black">
            No tickets to review.
          </p>
          <p className="text-sm text-zinc-400 mt-1">You&rsquo;re all caught up.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onDismiss={dismiss} />
          ))}
        </div>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-5 h-5 text-zinc-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
