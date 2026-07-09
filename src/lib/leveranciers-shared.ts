// Types, constants and pure helpers for leveranciers — split out from
// lib/data/leveranciers.ts so Client Components can import them without
// dragging in the server-only Supabase client (next/headers breaks the
// client bundle otherwise). Anything that touches the database belongs in
// lib/data/leveranciers.ts, not here.
import type { Eenheid } from "@/lib/recepten-shared";

export type LeverancierType =
  | "droogwaren_zuivel"
  | "vlees_charcuterie"
  | "groenten_fruit_eieren"
  | "brood_gebak"
  | "grootverpakking"
  | "dranken"
  | "diepvries"
  | "andere";

export const LEVERANCIER_TYPE_OPTIES: { value: LeverancierType; label: string }[] = [
  { value: "droogwaren_zuivel", label: "Droogwaren & zuivel" },
  { value: "vlees_charcuterie", label: "Vlees & charcuterie" },
  { value: "groenten_fruit_eieren", label: "Groenten, fruit & eieren" },
  { value: "brood_gebak", label: "Brood & gebak" },
  { value: "grootverpakking", label: "Grootverpakking" },
  { value: "dranken", label: "Dranken" },
  { value: "diepvries", label: "Diepvries" },
  { value: "andere", label: "Andere" },
];

export const LEVERANCIER_TYPE_LABEL: Record<LeverancierType, string> = Object.fromEntries(
  LEVERANCIER_TYPE_OPTIES.map((o) => [o.value, o.label])
) as Record<LeverancierType, string>;

export function typeLabel(type: LeverancierType | null): string {
  if (!type) return "Geen type";
  return LEVERANCIER_TYPE_LABEL[type] ?? type;
}

export function besteldeadlineLabel(dagen: number): string {
  if (dagen <= 0) return "Zelfde dag te bestellen";
  if (dagen === 1) return "Bestel 1 dag op voorhand";
  return `Bestel ${dagen} dagen op voorhand`;
}

export type IngredientRij = {
  id: string;
  naam: string;
  eenheid: Eenheid;
  categorie: string | null;
  verpakkingsgrootte: number | null;
};

export type Leverancier = {
  id: string;
  naam: string;
  type: LeverancierType | null;
  contact_info: string | null;
  besteldeadline_dagen: number;
  kleur: string;
  ingredienten: IngredientRij[];
};
