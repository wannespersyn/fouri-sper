// Types, constants and pure formatting helpers for boodschappen — split out
// from lib/data/boodschappen.ts so Client Components can import them without
// dragging in the server-only Supabase client (next/headers breaks the
// client bundle otherwise). Anything that touches the database belongs in
// lib/data/boodschappen.ts, not here.
import type { Eenheid } from "@/lib/recepten-shared";

export type BoodschappenStatus = "open" | "besteld" | "geleverd";

export type BoodschappenRegel = {
  ingredientId: string;
  ingredientNaam: string;
  eenheid: Eenheid;
  nettoHoeveelheid: number;
  verpakkingsgrootte: number | null;
  aantalVerpakkingen: number | null;
};

export type LeverancierBestelling = {
  leverancierId: string | null;
  leverancierNaam: string;
  leverancierKleur: string;
  regels: BoodschappenRegel[];
  boodschappenlijstId: string | null;
  status: BoodschappenStatus;
};

export type BestelDag = {
  dag: string;
  gesloten: boolean;
  bestelVoor2Dagen: boolean;
  dektTot: string;
};

// Zelfde statuskleuren-logica als slotStatusClass op de Menuplanner: grijs =
// nog niks gebeurd, oranje = in uitvoering/aandacht nodig, groen = klaar.
export function bestelStatusLabel(status: BoodschappenStatus): string {
  if (status === "besteld") return "Besteld";
  if (status === "geleverd") return "Geleverd";
  return "Nog te bestellen";
}

export function bestelStatusClass(status: BoodschappenStatus): string {
  if (status === "besteld") return "bg-[#fbe7db] text-[#b85a24]";
  if (status === "geleverd") return "bg-[#dcedd8] text-[#4f7a56]";
  return "bg-[#e6e0d4] text-[#7b7260]";
}
