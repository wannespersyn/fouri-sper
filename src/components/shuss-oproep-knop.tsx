"use client";

import { useState } from "react";
import { opslaanPushSubscriptie } from "@/lib/push/actions";
import { stuurShussOproep } from "@/app/(app)/streepjes/actions";
import { BellIcon, CheckIcon } from "@/components/icons";

const FLASH_DUUR_MS = 1500;

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function zorgVoorSubscriptie() {
  const registratie = await navigator.serviceWorker.ready;
  const bestaande = await registratie.pushManager.getSubscription();
  if (bestaande) return bestaande;

  const subscriptie = await registratie.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
  });
  await opslaanPushSubscriptie(subscriptie.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } });
  return subscriptie;
}

export function ShussOproepKnop() {
  const [status, setStatus] = useState<"idle" | "bezig" | "verstuurd" | "geweigerd">("idle");

  async function oproepen() {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    setStatus("bezig");

    const toestemming = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (toestemming !== "granted") {
      setStatus("geweigerd");
      window.setTimeout(() => setStatus("idle"), FLASH_DUUR_MS);
      return;
    }

    try {
      await zorgVoorSubscriptie();
      await stuurShussOproep();
      setStatus("verstuurd");
    } catch {
      setStatus("idle");
      return;
    }
    window.setTimeout(() => setStatus("idle"), FLASH_DUUR_MS);
  }

  return (
    <button
      type="button"
      onClick={oproepen}
      disabled={status === "bezig"}
      aria-label="Ik wil shussen — stuur een oproep"
      className="flex size-13 flex-none items-center justify-center rounded-full bg-accent text-white shadow-[0_6px_16px_rgba(0,0,0,0.3)] transition active:scale-90 disabled:opacity-60"
    >
      {status === "verstuurd" ? (
        <CheckIcon width={22} height={22} />
      ) : status === "geweigerd" ? (
        <BellIcon width={20} height={20} className="opacity-60" />
      ) : (
        <BellIcon width={22} height={22} />
      )}
    </button>
  );
}
