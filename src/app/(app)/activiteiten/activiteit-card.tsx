"use client";

import { useState } from "react";
import type { Activiteit } from "@/lib/activiteiten-shared";
import { MAALTIJD_MOMENT_LABEL, formatActiviteitPeriode } from "@/lib/activiteiten-shared";
import { upsertActiviteit, deleteActiviteit } from "@/app/(app)/activiteiten/actions";
import { ActiviteitFormFields, type GroepOptie } from "@/app/(app)/activiteiten/activiteit-form-fields";

export function ActiviteitCard({
  activiteit,
  groepen,
  kampStart,
  kampEind,
}: Readonly<{
  activiteit: Activiteit;
  groepen: GroepOptie[];
  kampStart: string;
  kampEind: string;
}>) {
  const [bewerken, setBewerken] = useState(false);

  if (bewerken) {
    return (
      <form
        action={async (formData) => {
          await upsertActiviteit(formData);
          setBewerken(false);
        }}
        className="flex flex-wrap items-end gap-2.5 rounded-[15px] border border-card-border bg-card p-4.5"
      >
        <input type="hidden" name="id" value={activiteit.id} />
        <ActiviteitFormFields
          idPrefix={`activiteit-${activiteit.id}`}
          groepen={groepen}
          kampStart={kampStart}
          kampEind={kampEind}
          defaultGroepId={activiteit.groep_id}
          defaultNaam={activiteit.naam}
          defaultVanDatum={activiteit.van_datum}
          defaultTotDatum={activiteit.tot_datum}
          defaultKleur={activiteit.kleur}
          defaultMomentenPerDag={activiteit.momentenPerDag}
        />
        <button
          type="submit"
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-white hover:bg-primary-2"
        >
          Opslaan
        </button>
        <button
          type="button"
          onClick={() => setBewerken(false)}
          className="rounded-lg px-3 py-1.5 text-sm font-bold text-[#6f7d72] hover:bg-black/5"
        >
          Annuleer
        </button>
        <button
          type="submit"
          formAction={deleteActiviteit}
          className="ml-auto rounded-lg bg-[#f7e2dc] px-3 py-1.5 text-sm font-bold text-[#a83e26] hover:bg-[#f0d0c6]"
        >
          Activiteit verwijderen
        </button>
      </form>
    );
  }

  const skipLabel = activiteit.momenten.map((m) => MAALTIJD_MOMENT_LABEL[m]).join(", ");
  const impactAantal = activiteit.groep_basis_aantal * activiteit.momenten.length;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-[15px] border border-card-border bg-card p-4.5">
      <div className="min-w-55 flex-1">
        <div className="flex items-center gap-2.25">
          <span className="size-2.75 flex-none rounded" style={{ background: activiteit.kleur }} />
          <span className="font-head text-lg font-extrabold">{activiteit.naam}</span>
        </div>
        <div className="mt-1 text-[13px] text-[#6f7d72]">
          {activiteit.groep_naam} · {formatActiviteitPeriode(activiteit.van_datum, activiteit.tot_datum)}
        </div>
      </div>

      <div className="min-w-55 flex-1">
        <div className="text-xs font-bold tracking-wide text-[#b85a24] uppercase">Eet niet mee</div>
        <div className="mt-1 text-[13px] text-[#3d4a42]">{skipLabel || "geen maaltijdmomenten gekozen"}</div>
        {activiteit.momenten.length > 0 && (
          <div className="mt-1.5 text-xs text-[#6f7d72]">
            → {impactAantal} eters minder per maaltijd · {activiteit.geraakteMaaltijden} maaltijden geraakt in de planner
          </div>
        )}
      </div>

      <button
        onClick={() => setBewerken(true)}
        className="flex-none self-start rounded-lg px-2.5 py-1 text-xs font-bold text-[#6f7d72] hover:bg-black/5"
      >
        Bewerken
      </button>
    </div>
  );
}
