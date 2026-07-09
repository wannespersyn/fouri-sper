"use client";

import { useRef } from "react";
import { EENHEID_LABEL } from "@/lib/recepten-shared";
import type { VoorraadRij as VoorraadRijType } from "@/lib/voorraad-shared";
import { updateVoorraad } from "@/app/(app)/voorraad/actions";

function laatstGeteldLabel(bijgewerktOp: string | null): string {
  if (!bijgewerktOp) return "Nog niet geteld";
  const datum = new Intl.DateTimeFormat("nl-BE", { day: "numeric", month: "short" }).format(
    new Date(bijgewerktOp)
  );
  return `Laatst geteld ${datum}`;
}

// Eén rij in de voorraadlijst: naam + categorie ter info, aantal is een
// inline invoerveld dat opslaat zodra je wegklikt (blur) of Enter drukt —
// bedoeld om snel door een volledig magazijn te tellen zonder telkens een
// aparte "bewerken"-modus te moeten openen. Alleen effectief gewijzigde
// waarden slaan op, zodat je gewoon door het formulier kan tabben zonder
// overal een onnodige update te triggeren.
export function VoorraadRij({ rij }: Readonly<{ rij: VoorraadRijType }>) {
  const gewijzigd = useRef(false);

  return (
    <form
      action={updateVoorraad}
      className="flex items-center gap-3 border-t border-[#eee3ce] px-4.5 py-3 first:border-t-0"
    >
      <input type="hidden" name="ingredient_id" value={rij.ingredientId} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{rij.naam}</p>
        <p className="text-xs text-[#8a8172]">{rij.categorie ?? "Geen categorie"}</p>
      </div>
      <span className="hidden text-xs text-[#8a8172] sm:inline">
        {laatstGeteldLabel(rij.bijgewerktOp)}
      </span>
      <div className="flex items-center gap-1.5">
        <input
          name="hoeveelheid"
          type="number"
          min={0}
          step="any"
          defaultValue={rij.hoeveelheid}
          onChange={() => {
            gewijzigd.current = true;
          }}
          onBlur={(e) => {
            if (!gewijzigd.current) return;
            gewijzigd.current = false;
            e.currentTarget.form?.requestSubmit();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          className="w-20 rounded-lg border border-card-border bg-white px-2.5 py-1.5 text-right font-head text-base font-bold text-[#243b2e] outline-none focus:border-[#cbb88d]"
        />
        <span className="w-14 text-xs font-semibold text-[#8a8172]">
          {EENHEID_LABEL[rij.eenheid]}
        </span>
      </div>
    </form>
  );
}
