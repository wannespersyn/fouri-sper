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
  leiding: boolean;
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
// streepjesdag (voor het dagklassement — wie had die dag zelf het meest),
// `totEnMetDag` cumuleert i.p.v. tot exact één dag te beperken (voor "wat was
// de totale stand toen" — bv. doorklikken vanaf een trui-badge naar de
// eindstand van die dag), `typeId` tot één specifiek drankje (bv. apart
// klassement voor Pintje vs. Sterke — daar telt elk streepje van dat type
// gewoon als 1, het gewicht is alleen relevant om soorten onderling te
// vergelijken in "Alle").
export function berekenLeaderboard(
  ruw: StreepjeRuw[],
  personen: StreepjePersoon[],
  types: StreepjeType[],
  opts?: { dag?: string; totEnMetDag?: string; typeId?: string }
): StreepjeLeaderboardRegel[] {
  const dagenPerPersoon = new Map<string, Set<string>>();
  const perTypePerPersoon = new Map<string, Record<string, number>>();

  for (const s of ruw) {
    const dag = streepjesDag(s.created_at);
    if (opts?.dag !== undefined && dag !== opts.dag) continue;
    if (opts?.totEnMetDag !== undefined && dag > opts.totEnMetDag) continue;
    if (opts?.typeId !== undefined && s.streepje_type_id !== opts.typeId) continue;

    const dagen = dagenPerPersoon.get(s.streepje_persoon_id) ?? new Set<string>();
    dagen.add(dag);
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

// Aantal streepjesdagen waarop deze persoon de meeste streepjes had van een
// subset types (bv. alle "bier"-achtige soorten samen) — elke dag heeft zijn
// eigen winnaar(s), dus over het hele kamp heen kan iemand er meerdere
// winnen. Gebruikt voor de "dagwinnaar"-badges op het profiel.
export function berekenDagWinstTellingen(ruw: StreepjeRuw[], typeIds: string[]): Map<string, number> {
  const perDagPerPersoon = new Map<string, Map<string, number>>();
  for (const s of ruw) {
    if (!typeIds.includes(s.streepje_type_id)) continue;
    const dag = streepjesDag(s.created_at);
    const perPersoon = perDagPerPersoon.get(dag) ?? new Map<string, number>();
    perPersoon.set(s.streepje_persoon_id, (perPersoon.get(s.streepje_persoon_id) ?? 0) + 1);
    perDagPerPersoon.set(dag, perPersoon);
  }

  const tellingen = new Map<string, number>();
  for (const perPersoon of perDagPerPersoon.values()) {
    const dagMax = Math.max(...perPersoon.values());
    if (dagMax === 0) continue;
    for (const [persoonId, aantal] of perPersoon) {
      if (aantal === dagMax) tellingen.set(persoonId, (tellingen.get(persoonId) ?? 0) + 1);
    }
  }
  return tellingen;
}

export type StreepjeTruiKleur = "geel" | "groen" | "bolletjes" | "wit";
export type StreepjeTruiTellingen = Record<StreepjeTruiKleur, number>;
export const TRUI_KLEUREN: StreepjeTruiKleur[] = ["geel", "groen", "bolletjes", "wit"];

// `brondag` = de dag wiens eindstand deze trui bepaalde (dag vóór `dag`) —
// nodig om vanaf een trui-dag door te linken naar de tótale stand die 'm
// effectief opleverde, i.p.v. naar de stand aan het eind van `dag` zelf (die
// kan intussen alweer veranderd zijn, want elke dag is een nieuwe etappe).
type TruiDagLeiders = { dag: string; brondag: string; leiders: Record<StreepjeTruiKleur, string[]> };

// Bepaalt per streepjesdag wie welke trui "droeg" — zoals in de Tour de
// France draag je een dag de trui van de eindstand van de vorige dag (de
// "finish" is 8u 's ochtends, exact het begin van de volgende streepjesdag),
// niet van je eigen streepjes die dag zelf. Wie vandaag geel draagt, had dus
// gisteren aan het einde van de dag het hoogste totaal — de eerste dag met
// streepjes heeft nog geen truidrager, net zoals er voor de start van rit 1
// nog geen geletruidrager is. Geel = algemeen klassement (gewogen totaal),
// groen/bolletjes = klassement voor één typegroep (resp. bier- en
// sterke-achtige soorten, ongewogen, net als de per-type tellingen), wit =
// hetzelfde als geel maar enkel onder personen met de leiding-vlag. Bij een
// gelijke stand krijgen alle gelijkstaanden mee, net als de
// dagwinnaar-badges. Basis voor zowel de tellingen (berekenTruiDagen) als de
// exacte datums per persoon (berekenTruiDagenVoorPersoon).
function berekenTruiDagLeiders(
  ruw: StreepjeRuw[],
  personen: StreepjePersoon[],
  types: StreepjeType[]
): TruiDagLeiders[] {
  const groenTypeIds = new Set(types.filter((t) => typeIcon(t.naam) === BierIcon).map((t) => t.id));
  const bolletjesTypeIds = new Set(types.filter((t) => typeIcon(t.naam) === SterkeIcon).map((t) => t.id));
  const leidingIds = new Set(personen.filter((p) => p.leiding).map((p) => p.id));

  const ruwPerDag = new Map<string, StreepjeRuw[]>();
  for (const s of ruw) {
    const dag = streepjesDag(s.created_at);
    const lijst = ruwPerDag.get(dag) ?? [];
    lijst.push(s);
    ruwPerDag.set(dag, lijst);
  }
  const dagen = [...ruwPerDag.keys()].sort((a, b) => a.localeCompare(b));

  const cumulatiefPerType = new Map<string, Record<string, number>>();

  function somTypes(perType: Record<string, number>, typeIds: Set<string>): number {
    let som = 0;
    for (const id of typeIds) som += perType[id] ?? 0;
    return som;
  }

  function leiders(scoor: (perType: Record<string, number>) => number, alleen?: Set<string>): string[] {
    let besteScore = 0;
    let uitslag: string[] = [];
    for (const [persoonId, perType] of cumulatiefPerType) {
      if (alleen && !alleen.has(persoonId)) continue;
      const score = scoor(perType);
      if (score <= 0) continue;
      if (score > besteScore) {
        besteScore = score;
        uitslag = [persoonId];
      } else if (score === besteScore) {
        uitslag.push(persoonId);
      }
    }
    return uitslag;
  }

  const resultaat: TruiDagLeiders[] = [];

  for (let i = 0; i < dagen.length; i++) {
    // Trui van vandaag = eindstand van gisteren, dus evalueren vóórdat de
    // streepjes van vandaag zelf worden toegevoegd aan het cumulatief.
    if (i > 0) {
      resultaat.push({
        dag: dagen[i],
        brondag: dagen[i - 1],
        leiders: {
          geel: leiders((perType) => gewogenTotaal(perType, types)),
          groen: leiders((perType) => somTypes(perType, groenTypeIds)),
          bolletjes: leiders((perType) => somTypes(perType, bolletjesTypeIds)),
          wit: leiders((perType) => gewogenTotaal(perType, types), leidingIds),
        },
      });
    }

    for (const s of ruwPerDag.get(dagen[i])!) {
      const perType = cumulatiefPerType.get(s.streepje_persoon_id) ?? {};
      perType[s.streepje_type_id] = (perType[s.streepje_type_id] ?? 0) + 1;
      cumulatiefPerType.set(s.streepje_persoon_id, perType);
    }
  }

  return resultaat;
}

export function berekenTruiDagen(
  ruw: StreepjeRuw[],
  personen: StreepjePersoon[],
  types: StreepjeType[]
): Map<string, StreepjeTruiTellingen> {
  const tellingen = new Map<string, StreepjeTruiTellingen>();
  for (const p of personen) tellingen.set(p.id, { geel: 0, groen: 0, bolletjes: 0, wit: 0 });

  for (const { leiders } of berekenTruiDagLeiders(ruw, personen, types)) {
    for (const kleur of TRUI_KLEUREN) {
      for (const id of leiders[kleur]) tellingen.get(id)![kleur]++;
    }
  }

  return tellingen;
}

// `dag` = de dag waarop je de trui droeg, `brondag` = de dag waarvan de
// tótale stand (t/m die dag) die trui opleverde — dat is de dag om naar door
// te linken, niet `dag` zelf (op `dag` zelf kan de stand alweer gewijzigd
// zijn, want dat is een nieuwe etappe).
export type StreepjeTruiDag = { dag: string; brondag: string };
export type StreepjeTruiDagenPerKleur = Record<StreepjeTruiKleur, StreepjeTruiDag[]>;

// Geeft de exacte streepjesdagen terug waarop deze persoon elke trui droeg
// (i.p.v. enkel het aantal), meest recente eerst — zodat je op het profiel
// kan tonen wannéér je een trui gewonnen hebt, met een link naar de tótale
// stand die 'm effectief opleverde.
export function berekenTruiDagenVoorPersoon(
  ruw: StreepjeRuw[],
  personen: StreepjePersoon[],
  types: StreepjeType[],
  persoonId: string
): StreepjeTruiDagenPerKleur {
  const resultaat: StreepjeTruiDagenPerKleur = { geel: [], groen: [], bolletjes: [], wit: [] };
  for (const { dag, brondag, leiders } of berekenTruiDagLeiders(ruw, personen, types)) {
    for (const kleur of TRUI_KLEUREN) {
      if (leiders[kleur].includes(persoonId)) resultaat[kleur].push({ dag, brondag });
    }
  }
  for (const kleur of TRUI_KLEUREN) resultaat[kleur].sort((a, b) => b.dag.localeCompare(a.dag));
  return resultaat;
}

export type StreepjeTruiRegel = { persoon: StreepjePersoon; truien: StreepjeTruiTellingen };

// Rangschikt iedereen die minstens één trui heeft gedragen, voor het
// truien-overzicht op het leaderboard — geel weegt het zwaarst (de
// belangrijkste classificatie), de andere tellingen dienen enkel als
// tie-breaker, net zoals in de Tour de France het algemeen klassement voorop
// staat. Met `opts.kleur` beperkt tot wie die specifieke trui droeg, gesorteerd
// op dat klassement alleen — zelfde filter-op-één-kolom idee als typeId bij
// berekenLeaderboard.
export function rangschikTruiTellingen(
  ruw: StreepjeRuw[],
  personen: StreepjePersoon[],
  types: StreepjeType[],
  opts?: { kleur?: StreepjeTruiKleur }
): StreepjeTruiRegel[] {
  const tellingen = berekenTruiDagen(ruw, personen, types);
  const regels = personen.map((persoon) => ({
    persoon,
    truien: tellingen.get(persoon.id) ?? { geel: 0, groen: 0, bolletjes: 0, wit: 0 },
  }));

  if (opts?.kleur) {
    const kleur = opts.kleur;
    return regels
      .filter((r) => r.truien[kleur] > 0)
      .sort((a, b) => b.truien[kleur] - a.truien[kleur] || a.persoon.naam.localeCompare(b.persoon.naam));
  }

  return regels
    .filter((r) => r.truien.geel > 0 || r.truien.groen > 0 || r.truien.bolletjes > 0 || r.truien.wit > 0)
    .sort(
      (a, b) =>
        b.truien.geel - a.truien.geel ||
        b.truien.groen - a.truien.groen ||
        b.truien.bolletjes - a.truien.bolletjes ||
        b.truien.wit - a.truien.wit ||
        a.persoon.naam.localeCompare(b.persoon.naam)
    );
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
