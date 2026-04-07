"use client";

import { useState } from "react";
import type { Ticket } from "./mock-tickets";

interface LogTableProps {
  entries: Ticket[];
}

type ActionFilter = "all" | "approved" | "denied" | "re_prompted";

const ACTION_LABELS: Record<string, string> = {
  approved: "Approved",
  denied: "Denied",
  re_prompted: "Re-prompted",
};

const ACTION_COLOURS: Record<string, string> = {
  approved: "text-emerald-700 bg-emerald-50",
  denied: "text-brand-red bg-red-50",
  re_prompted: "text-amber-700 bg-amber-50",
};

function formatAbsoluteTime(isoString: string): string {
  return new Date(isoString).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LogTable({ entries }: LogTableProps) {
  const [selectedClient, setSelectedClient] = useState("all");
  const [selectedAction, setSelectedAction] = useState<ActionFilter>("all");

  const clientIds = Array.from(new Set(entries.map((e) => e.client_id))).sort();

  const visible = entries.filter((e) => {
    if (selectedClient !== "all" && e.client_id !== selectedClient) return false;
    if (selectedAction !== "all" && e.status !== selectedAction) return false;
    return true;
  });

  return (
    <div className="flex-1 px-6 py-6 max-w-5xl mx-auto w-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
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

        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value as ActionFilter)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-brand-near-black focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
        >
          <option value="all">All actions</option>
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
          <option value="re_prompted">Re-prompted</option>
        </select>

        <span className="ml-auto text-sm text-zinc-500">
          {visible.length === 1 ? "1 entry" : `${visible.length} entries`}
        </span>
      </div>

      {/* Table */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-sm font-medium text-brand-near-black">
            No log entries found.
          </p>
          <p className="text-sm text-zinc-400 mt-1">
            Actioned tickets will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left">
                <th className="px-4 py-3 font-medium text-zinc-500 w-[38%]">
                  Title
                </th>
                <th className="px-4 py-3 font-medium text-zinc-500 w-[16%]">
                  Client
                </th>
                <th className="px-4 py-3 font-medium text-zinc-500 w-[20%]">
                  Workflow
                </th>
                <th className="px-4 py-3 font-medium text-zinc-500 w-[12%]">
                  Action
                </th>
                <th className="px-4 py-3 font-medium text-zinc-500 w-[14%]">
                  Actioned at
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((entry, i) => (
                <tr
                  key={entry.id}
                  className={
                    i < visible.length - 1 ? "border-b border-zinc-100" : ""
                  }
                >
                  <td className="px-4 py-3 text-brand-near-black font-medium leading-snug">
                    {entry.title}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{entry.client_id}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {entry.workflow_name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_COLOURS[entry.status] ?? ""}`}
                    >
                      {ACTION_LABELS[entry.status] ?? entry.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                    {entry.actioned_at
                      ? formatAbsoluteTime(entry.actioned_at)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
