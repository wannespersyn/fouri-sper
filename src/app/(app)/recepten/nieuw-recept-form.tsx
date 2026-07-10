"use client";

import { useState } from "react";
import { createRecept } from "@/app/(app)/recepten/actions";
import { RECEPT_CATEGORIEEN } from "@/lib/recepten-shared";

export function NieuwReceptForm() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-primary-2"
      >
        + Nieuw recept
      </button>
    );
  }

  return (
    <form
      action={createRecept}
      className="flex flex-wrap items-end gap-2 rounded-2xl border border-card-border bg-card p-2.5 shadow-[0_1px_0_rgba(35,48,42,0.04)]"
    >
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-wide text-[#8b846f]">Naam</label>
        <input
          name="naam"
          required
          autoFocus
          placeholder="bv. Spaghetti bolognaise"
          className="w-52 h-7 rounded-lg border border-card-border bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[#cbb88d]"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-wide text-[#8b846f]">Categorie</label>
        <select
          name="categorie"
          defaultValue={RECEPT_CATEGORIEEN[4]?.value ?? ""}
          className="h-7 rounded-lg border border-card-border bg-white px-2.5 py-1.5 text-sm"
        >
          {RECEPT_CATEGORIEEN.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="h-7 rounded-lg bg-primary px-3 text-sm font-bold text-white hover:bg-primary-2">
        Aanmaken
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="h-7 rounded-lg px-3 text-sm font-bold text-[#6f7d72] hover:bg-black/5"
      >
        Annuleer
      </button>
    </form>
  );
}
