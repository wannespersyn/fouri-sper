"use client";

import { useState } from "react";
import { LEVERANCIER_TYPE_OPTIES } from "@/lib/leveranciers-shared";
import { createLeverancier } from "@/app/(app)/leveranciers/actions";

export function NieuweLeverancierForm() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="self-start rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-2"
      >
        + Nieuwe leverancier
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await createLeverancier(formData);
        setOpen(false);
      }}
      className="flex flex-wrap items-end gap-2.5 rounded-[15px] border border-card-border bg-card p-4.5"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold">Kleur</label>
        <input
          name="kleur"
          type="color"
          defaultValue="#c8763a"
          className="h-7 w-12 rounded-lg border border-card-border bg-white p-1"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold">Naam</label>
        <input
          name="naam"
          required
          placeholder="bv. Bakkerij Dumont"
          className="h-7 rounded-lg border border-card-border bg-white px-2.5 py-1.5 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold">Type</label>
        <select
          name="type"
          defaultValue={LEVERANCIER_TYPE_OPTIES[0].value}
          className="h-7 rounded-lg border border-card-border bg-white px-2.5 py-1.5 text-sm"
        >
          {LEVERANCIER_TYPE_OPTIES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold">Contact</label>
        <input
          name="contact_info"
          placeholder="bv. Levert elke ochtend om 7u30"
          className="h-7 w-52 rounded-lg border border-card-border bg-white px-2.5 py-1.5 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold">Dagen op voorhand bestellen</label>
        <input
          name="besteldeadline_dagen"
          type="number"
          min={0}
          defaultValue={0}
          className="h-7 w-20 rounded-lg border border-card-border bg-white px-2.5 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        className="ml-auto rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-white hover:bg-primary-2"
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
