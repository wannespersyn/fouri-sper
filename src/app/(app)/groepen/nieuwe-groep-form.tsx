"use client";

import { useState } from "react";
import { createGroep } from "@/app/(app)/groepen/actions";

export function NieuweGroepForm() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="self-start rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-2"
      >
        + Nieuwe groep
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await createGroep(formData);
        setOpen(false);
      }}
      className="flex flex-wrap items-end gap-2.5 rounded-[15px] border border-card-border bg-card p-4.5"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold">Naam</label>
        <input
          name="naam"
          required
          placeholder="bv. Kapoenen"
          className="rounded-lg border border-card-border bg-white px-2.5 py-1.5 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold">Type</label>
        <select
          name="type"
          defaultValue="tak"
          className="rounded-lg border border-card-border bg-white px-2.5 py-1.5 text-sm"
        >
          <option value="tak">Tak</option>
          <option value="leiding">Leiding</option>
          <option value="fouri">Fouri</option>
          <option value="externen">Externen</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold">Aantal</label>
        <input
          name="basis_aantal"
          type="number"
          min={0}
          defaultValue={0}
          className="w-20 rounded-lg border border-card-border bg-white px-2.5 py-1.5 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold">Kleur</label>
        <input
          name="kleur"
          type="color"
          defaultValue="#2f6d4f"
          className="h-9 w-12 rounded-lg border border-card-border bg-white p-1"
        />
      </div>
      <button
        type="submit"
        className="rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-white hover:bg-primary-2"
      >
        Aanmaken
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="rounded-lg px-3 py-1.5 text-sm font-bold text-[#6f7d72] hover:bg-black/5"
      >
        Annuleer
      </button>
    </form>
  );
}
