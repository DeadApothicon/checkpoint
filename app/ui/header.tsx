"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";

interface HeaderProps {
  userEmail: string;
  unreadCount: number;
}

export function Header({ userEmail, unreadCount }: HeaderProps) {
  const initial = userEmail[0]?.toUpperCase() ?? "?";
  const [count, setCount] = useState(unreadCount);

  useEffect(() => {
    setCount(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/tickets/pending-count");
        if (res.ok) {
          const data = await res.json();
          setCount(data.count);
        }
      } catch {
        // ignore network errors — stale count is fine
      }
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="bg-white border-b border-zinc-200 px-6 h-14 flex items-center justify-between shrink-0">
      <span className="text-base font-semibold text-brand-near-black tracking-tight">
        Checkpoint
      </span>

      <div className="flex items-center gap-3">
        <nav className="flex items-center gap-1 mr-1">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg text-sm text-zinc-500 hover:bg-zinc-100 hover:text-brand-near-black transition-colors"
          >
            Queue
          </Link>
          <Link
            href="/log"
            className="px-3 py-1.5 rounded-lg text-sm text-zinc-500 hover:bg-zinc-100 hover:text-brand-near-black transition-colors"
          >
            Log
          </Link>
        </nav>

        <button
          onClick={() => window.location.assign("/")}
          className="relative p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-brand-near-black transition-colors"
          title="Notifications"
        >
          <BellIcon />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] rounded-full bg-brand-red text-white text-[0.6rem] font-semibold flex items-center justify-center px-0.5 leading-none">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-brand-near-black text-white text-xs font-medium flex items-center justify-center select-none">
            {initial}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-zinc-500 hover:text-brand-near-black transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

function BellIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}
