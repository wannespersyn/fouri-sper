"use client";

import { plaatsBestelling, markeerGeleverd } from "@/app/(app)/boodschappen/actions";
import { bestelStatusClass, bestelStatusLabel } from "@/lib/boodschappen-shared";
import type { LeverancierBestelling } from "@/lib/boodschappen-shared";
import { formatGetal, formatHoeveelheid } from "@/lib/recepten-shared";

export function LeverancierBestellingCard({
  bestelling,
  besteldag,
  dektTot,
}: Readonly<{
  bestelling: LeverancierBestelling;
  besteldag: string;
  dektTot: string;
}>) {
  const initiaal = bestelling.leverancierNaam.trim().charAt(0).toUpperCase() || "?";
  const kanBestellen = bestelling.leverancierId !== null;

  return (
    <div className="rounded-[15px] border border-card-border bg-card p-4.5">
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="flex size-10 flex-none items-center justify-center rounded-[11px] font-head text-[17px] font-extrabold text-white"
          style={{ background: bestelling.leverancierKleur }}
        >
          {initiaal}
        </div>
        <div className="min-w-0">
          <div className="font-head text-[17px] font-extrabold">{bestelling.leverancierNaam}</div>
          <div className="text-xs text-[#6f7d72]">
            {bestelling.regels.length} product{bestelling.regels.length === 1 ? "" : "en"}
          </div>
        </div>
        <span
          className={`ml-auto rounded-full px-2.5 py-1 text-[11px] font-extrabold ${bestelStatusClass(bestelling.status)}`}
        >
          {bestelStatusLabel(bestelling.status)}
        </span>
      </div>

      <div className="mt-3.5 flex flex-col gap-1.5 border-t border-[#eee3ce] pt-3">
        {bestelling.regels.map((regel) => (
          <div key={regel.ingredientId} className="flex items-center gap-2 text-sm">
            <span className="min-w-0 flex-1 truncate">{regel.ingredientNaam}</span>
            <span className="flex-none font-bold text-[#25322b]">
              {formatHoeveelheid(regel.nettoHoeveelheid, regel.eenheid)}
            </span>
            {regel.aantalVerpakkingen !== null && (
              <span className="flex-none text-xs text-[#8a8172]">
                ({formatGetal(regel.aantalVerpakkingen)}× {formatHoeveelheid(regel.verpakkingsgrootte ?? 0, regel.eenheid)})
              </span>
            )}
          </div>
        ))}
      </div>

      {!kanBestellen ? (
        <p className="mt-3.5 border-t border-[#eee3ce] pt-3 text-xs text-[#8a8172]">
          Wijs deze ingrediënten toe aan een leverancier via de Leveranciers-pagina om ze te kunnen bestellen.
        </p>
      ) : bestelling.status === "geleverd" ? null : bestelling.status === "besteld" ? (
        <form action={markeerGeleverd} className="mt-3.5 border-t border-[#eee3ce] pt-3">
          <input type="hidden" name="id" value={bestelling.boodschappenlijstId ?? ""} />
          <button
            type="submit"
            className="w-full rounded-lg border border-card-border bg-white py-2 text-[13px] font-bold text-primary hover:bg-[#eef4ee]"
          >
            Markeer als geleverd
          </button>
        </form>
      ) : (
        <form action={plaatsBestelling} className="mt-3.5 border-t border-[#eee3ce] pt-3">
          <input type="hidden" name="besteldag" value={besteldag} />
          <input type="hidden" name="dekt_tot" value={dektTot} />
          <input type="hidden" name="leverancier_id" value={bestelling.leverancierId ?? ""} />
          {bestelling.regels.map((regel) => (
            <span key={regel.ingredientId}>
              <input type="hidden" name="ingredient_id" value={regel.ingredientId} />
              <input type="hidden" name="hoeveelheid" value={regel.nettoHoeveelheid} />
            </span>
          ))}
          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-2 text-[13px] font-bold text-white hover:bg-primary-2"
          >
            Bestelling plaatsen
          </button>
        </form>
      )}
    </div>
  );
}
