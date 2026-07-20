// Types en pure helpers voor Shuss — client-safe (geen Supabase import), zelfde
// opzet als streepjes-shared.ts. Geen teams/partijen, gewoon drie simpele
// tellers per persoon: gewonnen, verloren, adje (rode vakje geraakt).

import type { StreepjePersoon } from "@/lib/streepjes-shared";

export type ShussSoort = "gewonnen" | "verloren" | "adje";
export type ShussGebeurtenis = { streepje_persoon_id: string; soort: ShussSoort };

export type ShussTellingen = { gewonnen: number; verloren: number; adjes: number };

// Max aantal mensen dat "ja" kan zeggen op een shuss-oproep, afzender
// inbegrepen — shuss speel je met z'n vieren, geen wachtrij nodig.
export const SHUSS_OPROEP_MAX_JA = 4;

// Een oproep ouder dan dit telt niet meer als "actief" — anders blijft een
// oproep van gisteren nog op het scherm staan alsof iemand nu wil shussen.
export const SHUSS_OPROEP_ACTIEF_MS = 3 * 60 * 60 * 1000;

export type ShussOproepReactie = "ja" | "nee";

export type HuidigeShussOproep = {
  id: string;
  afzenderNaam: string;
  isEigenOproep: boolean;
  aantalJa: number;
  eigenReactie: ShussOproepReactie | null;
};

export function berekenShussTellingen(gebeurtenissen: ShussGebeurtenis[], persoonId: string): ShussTellingen {
  const tellingen: ShussTellingen = { gewonnen: 0, verloren: 0, adjes: 0 };
  for (const g of gebeurtenissen) {
    if (g.streepje_persoon_id !== persoonId) continue;
    if (g.soort === "gewonnen") tellingen.gewonnen++;
    else if (g.soort === "verloren") tellingen.verloren++;
    else tellingen.adjes++;
  }
  return tellingen;
}

export function shussWinrate(tellingen: ShussTellingen): number | null {
  const partijen = tellingen.gewonnen + tellingen.verloren;
  return partijen > 0 ? tellingen.gewonnen / partijen : null;
}

// Rangschikt personen op winrate (met minstens 1 partij) of op totaal aantal
// adjes — "vaakst wint" en "beste schutter" zijn niet noodzakelijk dezelfde
// mensen.
export function berekenShussLeaderboard(
  gebeurtenissen: ShussGebeurtenis[],
  personen: StreepjePersoon[],
  sorteerOp: "winrate" | "adjes"
): { persoon: StreepjePersoon; tellingen: ShussTellingen; winrate: number | null }[] {
  return personen
    .map((persoon) => {
      const tellingen = berekenShussTellingen(gebeurtenissen, persoon.id);
      return { persoon, tellingen, winrate: shussWinrate(tellingen) };
    })
    .filter((r) => (sorteerOp === "adjes" ? r.tellingen.adjes > 0 : r.winrate !== null))
    .sort((a, b) => {
      if (sorteerOp === "adjes") {
        return b.tellingen.adjes - a.tellingen.adjes || a.persoon.naam.localeCompare(b.persoon.naam);
      }
      return (
        (b.winrate ?? 0) - (a.winrate ?? 0) ||
        b.tellingen.gewonnen - a.tellingen.gewonnen ||
        a.persoon.naam.localeCompare(b.persoon.naam)
      );
    });
}
