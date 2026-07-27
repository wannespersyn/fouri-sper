// Types en pure helpers voor Shuss — client-safe (geen Supabase import), zelfde
// opzet als streepjes-shared.ts. Geen teams/partijen, gewoon drie simpele
// tellers per persoon: gewonnen, verloren, adje (rode vakje geraakt).

import type { StreepjePersoon } from "@/lib/streepjes-shared";

export type ShussSoort = "gewonnen" | "verloren" | "adje";
export type ShussGebeurtenis = { streepje_persoon_id: string; soort: ShussSoort };

export type ShussTellingen = { gewonnen: number; verloren: number; adjes: number };

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

const WILSON_Z = 1.96; // 95%-betrouwbaarheidsinterval

// Wilson score (ondergrens) i.p.v. de kale winrate om op te rangschikken: 1/1
// gewonnen (100%) mag iemand met 18/20 (90%) niet voorbijsteken, want met 1
// partij weet je nog niets. Hoe meer partijen, hoe dichter deze score bij de
// werkelijke winrate kruipt; met weinig partijen duwt de onzekerheid ze naar
// beneden. Het getoonde percentage blijft gewoon de kale winrate — enkel de
// volgorde houdt rekening met het aantal partijen.
function wilsonScore(gewonnen: number, partijen: number): number {
  if (partijen === 0) return 0;
  const p = gewonnen / partijen;
  const z2 = WILSON_Z * WILSON_Z;
  const teller = p + z2 / (2 * partijen) - WILSON_Z * Math.sqrt((p * (1 - p) + z2 / (4 * partijen)) / partijen);
  const noemer = 1 + z2 / partijen;
  return teller / noemer;
}

// Rangschikt personen op winrate (met minstens 1 partij, gecorrigeerd voor
// het aantal partijen via wilsonScore) of op totaal aantal adjes — "vaakst
// wint" en "beste schutter" zijn niet noodzakelijk dezelfde mensen.
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
      const scoreA = wilsonScore(a.tellingen.gewonnen, a.tellingen.gewonnen + a.tellingen.verloren);
      const scoreB = wilsonScore(b.tellingen.gewonnen, b.tellingen.gewonnen + b.tellingen.verloren);
      return (
        scoreB - scoreA ||
        (b.winrate ?? 0) - (a.winrate ?? 0) ||
        b.tellingen.gewonnen - a.tellingen.gewonnen ||
        a.persoon.naam.localeCompare(b.persoon.naam)
      );
    });
}
