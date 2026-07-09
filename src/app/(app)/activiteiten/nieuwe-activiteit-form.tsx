"use client";

import { useState } from "react";
import { upsertActiviteit } from "@/app/(app)/activiteiten/actions";
import { ActiviteitFormFields, type GroepOptie } from "@/app/(app)/activiteiten/activiteit-form-fields";

export function NieuweActiviteitForm({
  groepen,
  kampStart,
  kampEind,
}: Readonly<{
  groepen: GroepOptie[];
  kampStart: string;
  kampEind: string;
}>) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={groepen.length === 0}
        className="self-start rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-2 disabled:cursor-not-allowed disabled:opacity-50"
        title={groepen.length === 0 ? "Maak eerst een groep aan bij Groepen" : undefined}
      >
        + Nieuwe activiteit
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await upsertActiviteit(formData);
        setOpen(false);
      }}
      className="flex flex-wrap items-end gap-2.5 rounded-[15px] border border-card-border bg-card p-4.5"
    >
      <ActiviteitFormFields idPrefix="nieuw" groepen={groepen} kampStart={kampStart} kampEind={kampEind} />
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
