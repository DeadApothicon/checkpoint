"use client";

import { useState } from "react";
import type { Ticket } from "./mock-tickets";

interface TicketCardProps {
  ticket: Ticket;
  onDismiss: (id: string) => void;
}

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function formatAbsoluteTime(isoString: string): string {
  return new Date(isoString).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TicketCard({ ticket, onDismiss }: TicketCardProps) {
  const [repromptOpen, setRepromptOpen] = useState(false);
  const [repromptText, setRepromptText] = useState("");

  function handleApprove() {
    onDismiss(ticket.id);
  }

  function handleDeny() {
    onDismiss(ticket.id);
  }

  function handleRepromptSubmit() {
    if (!repromptText.trim()) return;
    onDismiss(ticket.id);
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5 flex flex-col gap-4">
      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h2 className="text-sm font-semibold text-brand-near-black leading-snug">
            {ticket.title}
          </h2>
          <p className="text-xs text-zinc-400">
            {ticket.client_id} &middot; {ticket.workflow_name}
          </p>
        </div>
        <span
          className="text-xs text-zinc-400 whitespace-nowrap shrink-0 mt-0.5 cursor-default"
          title={formatAbsoluteTime(ticket.created_at)}
        >
          {formatRelativeTime(ticket.created_at)}
        </span>
      </div>

      {/* Body */}
      <div className="max-h-40 overflow-y-auto">
        <p className="text-sm text-brand-near-black whitespace-pre-wrap leading-relaxed">
          {ticket.body}
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-100" />

      {/* Action area */}
      {repromptOpen ? (
        <div className="flex flex-col gap-3">
          <textarea
            autoFocus
            value={repromptText}
            onChange={(e) => setRepromptText(e.target.value)}
            placeholder="Provide additional context for the AI to re-evaluate…"
            rows={3}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-brand-near-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setRepromptOpen(false);
                setRepromptText("");
              }}
              className="px-3 py-1.5 text-sm text-zinc-500 hover:text-brand-near-black transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRepromptSubmit}
              disabled={!repromptText.trim()}
              className="px-4 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Submit Re-Prompt
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={handleApprove}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            Approve
          </button>
          <button
            onClick={handleDeny}
            className="px-4 py-1.5 rounded-lg bg-brand-red text-white text-sm font-medium hover:bg-brand-red-dark transition-colors"
          >
            Deny
          </button>
          {ticket.is_ai_generated && (
            <button
              onClick={() => setRepromptOpen(true)}
              className="px-4 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
            >
              Re-Prompt
            </button>
          )}
        </div>
      )}
    </div>
  );
}
