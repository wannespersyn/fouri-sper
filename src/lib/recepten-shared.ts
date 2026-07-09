// Types, constants and pure formatting helpers for recepten — split out from
// lib/data/recepten.ts so Client Components can import them without dragging
// in the server-only Supabase client (next/headers breaks the client bundle
// otherwise). Anything that touches the database belongs in
// lib/data/recepten.ts, not here.
import { MAALTIJD_MOMENTEN, MAALTIJD_MOMENT_LABEL } from "@/lib/activiteiten-shared";

export type Eenheid = "g" | "kg" | "l" | "ml" | "st" | "sn";

export const EENHEDEN: { value: Eenheid; label: string }[] = [
  { value: "g", label: "gram" },
  { value: "kg", label: "kilogram" },
  { value: "l", label: "liter" },
  { value: "ml", label: "milliliter" },
  { value: "st", label: "stuks" },
  { value: "sn", label: "sneden" },
];

export const EENHEID_LABEL: Record<Eenheid, string> = Object.fromEntries(
  EENHEDEN.map((e) => [e.value, e.label])
) as Record<Eenheid, string>;

export type HoeveelheidModus = "per_persoon" | "vast_totaal";

export type ReceptStatus = "concept" | "actief";

export const RECEPT_STATUS_OPTIES: { value: ReceptStatus; label: string }[] = [
  { value: "concept", label: "Concept" },
  { value: "actief", label: "Actief" },
];

// Recept-categorie hergebruikt gewoon de maaltijd-momenten — zo lijnen de
// filtertabs hier meteen aan met de slots in de Menuplanner later.
export const RECEPT_CATEGORIEEN = MAALTIJD_MOMENTEN;
export const RECEPT_CATEGORIE_LABEL = MAALTIJD_MOMENT_LABEL;

export function categorieLabel(categorie: string | null): string {
  if (!categorie) return "Geen categorie";
  return RECEPT_CATEGORIE_LABEL[categorie as keyof typeof RECEPT_CATEGORIE_LABEL] ?? categorie;
}

export type IngredientOptie = {
  id: string;
  naam: string;
  eenheid: Eenheid;
  leverancier_id: string | null;
  leverancier_naam: string | null;
  categorie: string | null;
};

export type LeverancierOptie = { id: string; naam: string };

export type ReceptIngredientRegel = {
  id: string;
  ingredient_id: string;
  ingredient_naam: string;
  eenheid: Eenheid;
  leverancier_naam: string | null;
  modus: HoeveelheidModus;
  hoeveelheid_per_persoon: number | null;
  vast_totaal: number | null;
  volgorde: number;
};

export type DieetAanpassingRegel = {
  id: string;
  dieettype_id: string;
  vervangt_ingredient_id: string | null;
  vervangt_ingredient_naam: string | null;
  vervangen_door_ingredient_id: string | null;
  vervangen_door_ingredient_naam: string | null;
  modus: HoeveelheidModus | null;
  hoeveelheid_per_persoon: number | null;
  vast_totaal: number | null;
  notitie: string | null;
};

export type DieetSectie = {
  dieettype_id: string;
  dieettype_naam: string;
  dieettype_kleur: string;
  inGebruikInKamp: boolean;
  aanpassingen: DieetAanpassingRegel[];
};

export type ReceptSamenvatting = {
  id: string;
  naam: string;
  categorie: string | null;
  status: ReceptStatus;
  ingredientenAantal: number;
  groepenIngepland: number;
  ontbrekendeDietenAantal: number;
};

export type ReceptDetail = ReceptSamenvatting & {
  ingredienten: ReceptIngredientRegel[];
  dieetSecties: DieetSectie[];
};

export function formatGetal(waarde: number): string {
  const afgerond = Math.round(waarde * 10) / 10;
  const tekst = Number.isInteger(afgerond) ? afgerond.toFixed(0) : afgerond.toFixed(1);
  return tekst.replace(".", ",");
}

export function formatHoeveelheid(waarde: number, eenheid: Eenheid): string {
  return `${formatGetal(waarde)} ${EENHEID_LABEL[eenheid]}`;
}

// Live-berekende hoeveelheid voor een receptregel bij een gekozen aantal
// eters — puur client-side rekenwerk voor de "reken voor X eters"-preview op
// de receptpagina zelf. Het echte, definitieve aantal eters per maaltijd
// komt van v_maaltijd_behoefte zodra het recept effectief ingepland is via
// de Menuplanner.
export function berekenTotaal(regel: Pick<ReceptIngredientRegel, "modus" | "hoeveelheid_per_persoon" | "vast_totaal">, eters: number): number {
  if (regel.modus === "vast_totaal") return regel.vast_totaal ?? 0;
  return (regel.hoeveelheid_per_persoon ?? 0) * Math.max(0, eters);
}
