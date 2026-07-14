"use client";

import { useActionState } from "react";
import { stelWachtwoordIn, type WachtwoordState } from "@/app/auth/wachtwoord-instellen/actions";

const initialState: WachtwoordState = { error: null };

export function WachtwoordForm() {
  const [state, formAction, pending] = useActionState(stelWachtwoordIn, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-bold">
          Wachtwoord
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          className="rounded-[11px] border border-card-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password_herhaal" className="text-sm font-bold">
          Herhaal wachtwoord
        </label>
        <input
          id="password_herhaal"
          name="password_herhaal"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          className="rounded-[11px] border border-card-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>

      {state.error && (
        <p className="rounded-[11px] bg-[#f7e2dc] px-3.5 py-2.5 text-sm font-semibold text-[#a83e26]">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1.5 rounded-[11px] bg-primary py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-2 disabled:opacity-60"
      >
        {pending ? "Bezig met opslaan…" : "Wachtwoord instellen"}
      </button>
    </form>
  );
}
