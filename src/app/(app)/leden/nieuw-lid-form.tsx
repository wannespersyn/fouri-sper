"use client";

import { useActionState } from "react";
import { inviteLid, type InviteState } from "@/app/(app)/leden/actions";

const initialState: InviteState = { error: null, success: null };

export function NieuwLidForm() {
  const [state, formAction, pending] = useActionState(inviteLid, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-2.5 rounded-[15px] border border-card-border bg-card p-4.5"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold">E-mailadres</label>
        <input
          name="email"
          type="email"
          required
          placeholder="naam@voorbeeld.be"
          className="rounded-lg border border-card-border bg-white px-2.5 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-white hover:bg-primary-2 disabled:opacity-60"
      >
        {pending ? "Bezig…" : "Uitnodigen"}
      </button>
      {state.error && (
        <p className="w-full text-sm font-semibold text-[#a83e26]">{state.error}</p>
      )}
      {state.success && (
        <p className="w-full text-sm font-semibold text-primary">{state.success}</p>
      )}
    </form>
  );
}
