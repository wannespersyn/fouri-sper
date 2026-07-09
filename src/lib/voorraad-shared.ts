// Types for voorraad — split out from lib/data/voorraad.ts so Client
// Components can import them without dragging in the server-only Supabase
// client (next/headers breaks the client bundle otherwise). Anything that
// touches the database belongs in lib/data/voorraad.ts, not here.
import type { Eenheid } from "@/lib/recepten-shared";

// Eén rij per ingrediënt in het kamp, ook als er nog nooit een voorraad
// geteld is (hoeveelheid dan 0, bijgewerktOp dan null). Zo is de pagina
// meteen een volledige, invulbare inventarislijst in plaats van dat ze leeg
// begint tot iemand ergens anders een voorraad-rij aanmaakt.
export type VoorraadRij = {
  ingredientId: string;
  naam: string;
  eenheid: Eenheid;
  categorie: string | null;
  hoeveelheid: number;
  bijgewerktOp: string | null;
};
