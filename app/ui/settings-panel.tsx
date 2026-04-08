"use client";

import { useState, useEffect } from "react";
import { setEmailNotifications } from "@/app/actions";

interface SettingsPanelProps {
  emailNotifications: boolean;
}

export function SettingsPanel({ emailNotifications: initial }: SettingsPanelProps) {
  const [emailEnabled, setEmailEnabled] = useState(initial);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setPushSupported(true);

    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription()
    ).then((sub) => {
      setPushEnabled(sub !== null);
    });
  }, []);

  async function handleEmailToggle() {
    const next = !emailEnabled;
    setEmailEnabled(next);
    await setEmailNotifications(next);
  }

  async function handlePushToggle() {
    setPushLoading(true);
    try {
      if (pushEnabled) {
        await disablePush();
        setPushEnabled(false);
      } else {
        const ok = await enablePush();
        setPushEnabled(ok);
      }
    } finally {
      setPushLoading(false);
    }
  }

  async function enablePush(): Promise<boolean> {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const keyRes = await fetch("/api/push/public-key");
    if (!keyRes.ok) return false;
    const { publicKey } = await keyRes.json();

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub),
    });

    return true;
  }

  async function disablePush() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;

    await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });

    await sub.unsubscribe();
  }

  return (
    <div className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full">
      <h1 className="text-lg font-semibold text-brand-near-black mb-6">Settings</h1>

      <section className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100">
        <div className="px-5 py-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
            Notifications
          </h2>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-brand-near-black">Email notifications</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Receive an email when a new ticket arrives
              </p>
            </div>
            <Toggle enabled={emailEnabled} onToggle={handleEmailToggle} disabled={false} />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-brand-near-black">Browser notifications</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {pushSupported
                  ? "Receive OS-level push notifications when a new ticket arrives"
                  : "Not supported in this browser"}
              </p>
            </div>
            <Toggle
              enabled={pushEnabled}
              onToggle={handlePushToggle}
              disabled={!pushSupported || pushLoading}
            />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-zinc-200 mt-4 px-5 py-4 opacity-50">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
          User management
        </h2>
        <p className="text-sm text-zinc-400">
          Multi-user support, role-based access, and client assignments — available in a future
          release.
        </p>
      </section>
    </div>
  );
}

interface ToggleProps {
  enabled: boolean;
  onToggle: () => void;
  disabled: boolean;
}

function Toggle({ enabled, onToggle, disabled }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${
        enabled ? "bg-brand-red" : "bg-zinc-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0)));
}
