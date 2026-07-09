"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/login/actions";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-bold">
          E-mailadres
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-[11px] border border-card-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-bold">
          Wachtwoord
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
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
        {pending ? "Bezig met inloggen…" : "Inloggen"}
      </button>
    </form>
  );
}
