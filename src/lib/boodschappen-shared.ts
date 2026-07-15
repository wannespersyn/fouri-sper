// Types, constants and pure formatting helpers for boodschappen — split out
// from lib/data/boodschappen.ts so Client Components can import them without
// dragging in the server-only Supabase client (next/headers breaks the
// client bundle otherwise). Anything that touches the database belongs in
// lib/data/boodschappen.ts, not here.
import type { Eenheid } from "@/lib/recepten-shared";

export type GerechtBoodschappenRegel = {
  ingredientId: string;
  ingredientNaam: string;
  eenheid: Eenheid;
  hoeveelheid: number;
  afgevinkt: boolean;
};

// Wat één gerecht op deze besteldag nodig heeft van de leverancier waar de
// kaart bij hoort.
export type GerechtBoodschappen = {
  receptId: string;
  receptNaam: string;
  regels: GerechtBoodschappenRegel[];
};

export type LeverancierBestelling = {
  leverancierId: string | null;
  leverancierNaam: string;
  leverancierKleur: string;
  gerechten: GerechtBoodschappen[];
};

export type BestelDag = {
  dag: string;
  gesloten: boolean;
  bestelVoor2Dagen: boolean;
  dektTot: string;
};
