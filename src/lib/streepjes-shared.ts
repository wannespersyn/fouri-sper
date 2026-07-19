// Types en pure helpers voor streepjes — client-safe (geen Supabase import),
// zodat StreepjesClient dit los van de server-only data-laag kan gebruiken.

import { BierIcon, SterkeIcon, StreepjesIcon } from "@/components/icons";

// Herkent het drankicoon aan de naam — valt terug op een generiek glas voor
// soorten die geen "bier" of "sterke" in de naam hebben (soortenlijst is per
// kamp instelbaar, dus dit moet ook met nieuwe/andere namen blijven werken).
export function typeIcon(naam: string) {
  const n = naam.toLowerCase();
  if (n.includes("bier") || n.includes("pint")) return BierIcon;
  if (n.includes("sterk")) return SterkeIcon;
  return StreepjesIcon;
}

export type StreepjePersoon = {
  id: string;
  naam: string;
  favoriet: boolean;
  bio: string | null;
  fotoUrl: string | null;
};
// gewicht: hoeveel een streepje van dit type meetelt in gecombineerde totalen
// (bv. Sterke = 2 t.o.v. Pintje = 1) — per-type aantallen blijven ongewogen.
export type StreepjeType = { id: string; naam: string; kleur: string; gewicht: number };
// Eén rij per streepje, met tijdstip — basis voor leaderboard- en
// per-dag-aggregatie.
export type StreepjeRuw = { streepje_persoon_id: string; streepje_type_id: string; created_at: string };

const STREEPJES_TIJDZONE = "Europe/Brussels";
const DAG_START_UUR = 8;

// Een "streepjesdag" loopt van 8u 's ochtends tot 8u 's ochtends de volgende
// dag (een kampavond stopt niet netjes om middernacht). We lezen de lokale
// jaar/maand/dag/uur in Brussel via Intl uit i.p.v. handmatige Date-
// arithmetiek, zodat de zomer/wintertijd-overgang geen rare sprongen geeft.
export function streepjesDag(createdAtIso: string): string {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: STREEPJES_TIJDZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(dtf.formatToParts(new Date(createdAtIso)).map((p) => [p.type, p.value]));
  const jaar = Number(parts.year);
  const maand = Number(parts.month);
  const dag = Number(parts.day);
  const uur = Number(parts.hour) % 24; // Intl geeft soms "24" i.p.v. "00"

  const dagStart = new Date(Date.UTC(jaar, maand - 1, dag));
  if (uur < DAG_START_UUR) dagStart.setUTCDate(dagStart.getUTCDate() - 1);
  return dagStart.toISOString().slice(0, 10);
}

export function huidigeStreepjesDag(): string {
  return streepjesDag(new Date().toISOString());
}

export type StreepjeLeaderboardRegel = {
  persoon: StreepjePersoon;
  aantal: number;
  // Alleen zinvol in "totaal"-modus (opts.dag ongezet) — het gemiddelde
  // aantal streepjes op de dagen dat iemand er effectief bij was, i.p.v.
  // gedeeld door de volledige kampduur (die zou onterecht dalen voor wie
  // pas halverwege het kamp toekwam).
  gemiddeldePerDag: number;
  perType: Record<string, number>;
};

// Som van aantalPerType, gewogen per type (Sterke telt bv. dubbel zo zwaar
// als Pintje) — gebruikt voor elke gecombineerde "Totaal", i.t.t. de
// per-type aantallen zelf, die altijd ongewogen blijven.
export function gewogenTotaal(aantalPerType: Record<string, number>, types: StreepjeType[]): number {
  return types.reduce((som, t) => som + (aantalPerType[t.id] ?? 0) * t.gewicht, 0);
}

// Rangschikt personen op aantal streepjes. Zonder opties all-time en over
// alle soorten heen (dan gewogen per type); `dag` beperkt tot één
// streepjesdag, `typeId` tot één specifiek drankje (bv. apart klassement voor
// Pintje vs. Sterke — daar telt elk streepje van dat type gewoon als 1, het
// gewicht is alleen relevant om soorten onderling te vergelijken in "Alle").
export function berekenLeaderboard(
  ruw: StreepjeRuw[],
  personen: StreepjePersoon[],
  types: StreepjeType[],
  opts?: { dag?: string; typeId?: string }
): StreepjeLeaderboardRegel[] {
  const dagenPerPersoon = new Map<string, Set<string>>();
  const perTypePerPersoon = new Map<string, Record<string, number>>();

  for (const s of ruw) {
    if (opts?.dag !== undefined && streepjesDag(s.created_at) !== opts.dag) continue;
    if (opts?.typeId !== undefined && s.streepje_type_id !== opts.typeId) continue;

    const dagen = dagenPerPersoon.get(s.streepje_persoon_id) ?? new Set<string>();
    dagen.add(streepjesDag(s.created_at));
    dagenPerPersoon.set(s.streepje_persoon_id, dagen);

    const perType = perTypePerPersoon.get(s.streepje_persoon_id) ?? {};
    perType[s.streepje_type_id] = (perType[s.streepje_type_id] ?? 0) + 1;
    perTypePerPersoon.set(s.streepje_persoon_id, perType);
  }

  return personen
    .map((persoon) => {
      const perType = perTypePerPersoon.get(persoon.id) ?? {};
      const aantal =
        opts?.typeId !== undefined ? (perType[opts.typeId] ?? 0) : gewogenTotaal(perType, types);
      const aantalDagen = dagenPerPersoon.get(persoon.id)?.size ?? 0;
      return {
        persoon,
        aantal,
        gemiddeldePerDag: aantalDagen > 0 ? aantal / aantalDagen : 0,
        perType,
      };
    })
    .filter((r) => r.aantal > 0)
    .sort((a, b) => b.aantal - a.aantal || a.persoon.naam.localeCompare(b.persoon.naam));
}

export type StreepjePersoonOverzicht = {
  totaalPerType: Record<string, number>;
  perDag: { dag: string; aantalPerType: Record<string, number> }[];
};

// Bouwt het per-persoon overzicht: totalen per type over het hele kamp, plus
// een dag-per-dag opsplitsing (meest recente streepjesdag eerst).
export function berekenPersoonOverzicht(
  ruw: StreepjeRuw[],
  persoonId: string,
  types: StreepjeType[]
): StreepjePersoonOverzicht {
  const totaalPerType: Record<string, number> = {};
  const perDagMap = new Map<string, Record<string, number>>();

  for (const s of ruw) {
    if (s.streepje_persoon_id !== persoonId) continue;
    totaalPerType[s.streepje_type_id] = (totaalPerType[s.streepje_type_id] ?? 0) + 1;

    const dag = streepjesDag(s.created_at);
    const aantalPerType = perDagMap.get(dag) ?? {};
    aantalPerType[s.streepje_type_id] = (aantalPerType[s.streepje_type_id] ?? 0) + 1;
    perDagMap.set(dag, aantalPerType);
  }

  for (const t of types) totaalPerType[t.id] ??= 0;

  const perDag = [...perDagMap.entries()]
    .map(([dag, aantalPerType]) => ({ dag, aantalPerType }))
    .sort((a, b) => b.dag.localeCompare(a.dag));

  return { totaalPerType, perDag };
}

function normaliseer(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Sorteert op relevantie (naam-prefix > woord-prefix > losse substring), met
// een lichte voorkeur voor favorieten. Bij een lege zoekopdracht staan
// favorieten gewoon bovenaan, alfabetisch — zo hoef je meestal niets te typen.
export function zoekPersonen(personen: StreepjePersoon[], query: string): StreepjePersoon[] {
  const termen = normaliseer(query).trim().split(/\s+/).filter(Boolean);

  if (termen.length === 0) {
    return [...personen].sort(
      (a, b) => Number(b.favoriet) - Number(a.favoriet) || a.naam.localeCompare(b.naam)
    );
  }

  const gescoord: { persoon: StreepjePersoon; score: number }[] = [];
  for (const persoon of personen) {
    const naam = normaliseer(persoon.naam);
    const woorden = naam.split(/\s+/);
    let score = 0;
    let alleGevonden = true;
    for (const term of termen) {
      if (naam.startsWith(term)) score += 3;
      else if (woorden.some((w) => w.startsWith(term))) score += 2;
      else if (naam.includes(term)) score += 1;
      else {
        alleGevonden = false;
        break;
      }
    }
    if (alleGevonden) gescoord.push({ persoon, score: score + (persoon.favoriet ? 0.5 : 0) });
  }

  return gescoord
    .sort((a, b) => b.score - a.score || a.persoon.naam.localeCompare(b.persoon.naam))
    .map((x) => x.persoon);
}
