"use client";

import { useActionState } from "react";
import { createKamp, type CreateKampState } from "@/lib/data/kamp-actions";

const initialState: CreateKampState = { error: null };

export function CreateKampForm() {
  const [state, formAction, pending] = useActionState(createKamp, initialState);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-5.5">
      <div className="w-full max-w-sm rounded-2xl border border-card-border bg-card p-7">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-2.75 flex size-9.5 items-center justify-center rounded-[11px] bg-accent font-head text-xl font-extrabold text-white">
            F
          </div>
          <h1 className="font-head text-lg font-extrabold tracking-tight">Nieuw kamp</h1>
          <p className="mt-1 text-[13px] text-[#6f7d72]">
            Er is nog geen actief kamp — maak er eerst eentje aan, dan kun je aan de
            slag met groepen, menu&apos;s en boodschappen.
          </p>
        </div>

        <form action={formAction} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="naam" className="text-sm font-bold">
              Naam van het kamp
            </label>
            <input
              id="naam"
              name="naam"
              type="text"
              placeholder="Kamp Marche 2026"
              required
              className="rounded-[11px] border border-card-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="flex gap-2.5">
            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor="start_datum" className="text-sm font-bold">
                Start
              </label>
              <input
                id="start_datum"
                name="start_datum"
                type="date"
                required
                className="rounded-[11px] border border-card-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor="eind_datum" className="text-sm font-bold">
                Einde
              </label>
              <input
                id="eind_datum"
                name="eind_datum"
                type="date"
                required
                className="rounded-[11px] border border-card-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
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
            {pending ? "Bezig…" : "Kamp aanmaken"}
          </button>
        </form>
      </div>
    </div>
  );
}
