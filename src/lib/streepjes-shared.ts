// Types en pure helpers voor streepjes — client-safe (geen Supabase import),
// zodat StreepjesClient dit los van de server-only data-laag kan gebruiken.

export type StreepjePersoon = { id: string; naam: string; favoriet: boolean };
export type StreepjeType = { id: string; naam: string; kleur: string };
// persoonId -> typeId -> aantal, voor de hele kampduur.
export type StreepjeTellingen = Record<string, Record<string, number>>;

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
