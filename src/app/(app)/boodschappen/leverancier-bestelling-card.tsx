"use client";

import { toggleAfgevinkt } from "@/app/(app)/boodschappen/actions";
import type { LeverancierBestelling } from "@/lib/boodschappen-shared";
import { formatHoeveelheid } from "@/lib/recepten-shared";
import { CheckIcon } from "@/components/icons";

export function LeverancierBestellingCard({
  bestelling,
  besteldag,
}: Readonly<{
  bestelling: LeverancierBestelling;
  besteldag: string;
}>) {
  const initiaal = bestelling.leverancierNaam.trim().charAt(0).toUpperCase() || "?";
  const aantalProducten = new Set(
    bestelling.gerechten.flatMap((g) => g.regels.map((r) => r.ingredientId))
  ).size;

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
            {aantalProducten} product{aantalProducten === 1 ? "" : "en"}
          </div>
        </div>
      </div>

      {bestelling.gerechten.length > 0 && (
        <div className="mt-3.5 flex flex-col gap-3 border-t border-[#eee3ce] pt-3">
          {bestelling.gerechten.map((gerecht) => (
            <div key={gerecht.receptId}>
              <div className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-[#8a8172]">
                {gerecht.receptNaam}
              </div>
              <div className="flex flex-col gap-1">
                {gerecht.regels.map((regel) => (
                  <form
                    key={regel.ingredientId}
                    action={toggleAfgevinkt}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input type="hidden" name="besteldag" value={besteldag} />
                    <input type="hidden" name="recept_id" value={gerecht.receptId} />
                    <input type="hidden" name="ingredient_id" value={regel.ingredientId} />
                    <input type="hidden" name="huidig" value={String(regel.afgevinkt)} />
                    <button
                      type="submit"
                      aria-label={regel.afgevinkt ? "Afvinken ongedaan maken" : "Afvinken"}
                      aria-pressed={regel.afgevinkt}
                      className="flex size-5 flex-none items-center justify-center rounded-md border transition"
                      style={
                        regel.afgevinkt
                          ? { borderColor: "var(--primary)", background: "var(--primary)", color: "#fff" }
                          : { borderColor: "#d8d0bc", background: "#fff" }
                      }
                    >
                      {regel.afgevinkt && <CheckIcon width={12} height={12} />}
                    </button>
                    <span
                      className="min-w-0 flex-1 truncate text-left"
                      style={regel.afgevinkt ? { color: "#a3a08f", textDecoration: "line-through" } : undefined}
                    >
                      {regel.ingredientNaam}
                    </span>
                    <span
                      className="flex-none font-bold"
                      style={{ color: regel.afgevinkt ? "#a3a08f" : "#25322b" }}
                    >
                      {formatHoeveelheid(regel.hoeveelheid, regel.eenheid)}
                    </span>
                  </form>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {bestelling.leverancierId === null && (
        <p className="mt-3.5 border-t border-[#eee3ce] pt-3 text-xs text-[#8a8172]">
          Wijs deze ingrediënten toe aan een leverancier via de Leveranciers-pagina.
        </p>
      )}
    </div>
  );
}
