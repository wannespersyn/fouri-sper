// Types, constants and pure formatting helpers for de menuplanner — split
// out from lib/data/menuplanner.ts so Client Components can import them
// without dragging in the server-only Supabase client (next/headers breaks
// the client bundle otherwise). Anything that touches the database belongs
// in lib/data/menuplanner.ts, not here.
import { MAALTIJD_MOMENTEN, MAALTIJD_MOMENT_LABEL } from "@/lib/activiteiten-shared";
import type { MaaltijdMoment } from "@/lib/activiteiten-shared";

export type { MaaltijdMoment };
export { MAALTIJD_MOMENTEN, MAALTIJD_MOMENT_LABEL };

// De vijf vaste momenten — middernachtsnack is het optionele zesde moment en
// telt niet mee in de weekoverzicht-stipjes.
export const HOOFDMOMENTEN: MaaltijdMoment[] = MAALTIJD_MOMENTEN.filter(
  (m) => m.value !== "middernacht_snack"
).map((m) => m.value);

// Puur cosmetisch — geen kolom in de databank, gewoon een richttijd per
// moment zodat de maaltijdkaarten er niet kaal bij staan.
export const MOMENT_TIJD: Record<MaaltijdMoment, string> = {
  ontbijt: "08u00",
  tienuurtje: "10u00",
  middag: "12u30",
  vieruurtje: "16u00",
  avond: "18u30",
  middernacht_snack: "00u30",
};

export type SlotStatus = "leeg" | "allergie" | "klaar";

export function slotStatus(toewijzingen: Pick<MaaltijdToewijzing, "statusOk">[]): SlotStatus {
  if (toewijzingen.length === 0) return "leeg";
  return toewijzingen.every((t) => t.statusOk) ? "klaar" : "allergie";
}

export function slotStatusLabel(status: SlotStatus): string {
  if (status === "klaar") return "Klaar";
  if (status === "allergie") return "Allergieën nog in te vullen";
  return "Nog in te plannen";
}

// Zelfde kleurenpalet als de statusbadges op de Recepten-pagina — "klaar" en
// "leeg" hergebruiken letterlijk de "actief"/"concept"-tokens van daar,
// "allergie" hergebruikt de waarschuwingskleur van Groepen/Activiteiten.
export function slotStatusClass(status: SlotStatus): string {
  if (status === "klaar") return "bg-[#dcedd8] text-[#4f7a56]";
  if (status === "allergie") return "bg-[#fbe7db] text-[#b85a24]";
  return "bg-[#e6e0d4] text-[#7b7260]";
}

export function slotDotClass(status: SlotStatus): string {
  if (status === "klaar") return "bg-[#3f8f5f]";
  if (status === "allergie") return "bg-[#d9862f]";
  return "bg-[#cdc4b0]";
}

export type ToewijzingGroep = { id: string; naam: string; kleur: string };

export type MaaltijdToewijzing = {
  id: string;
  recept_id: string;
  recept_naam: string;
  eters: number;
  groepen: ToewijzingGroep[];
  ontbrekendeDieten: string[];
  statusOk: boolean;
};

export type MaaltijdSlot = {
  moment: MaaltijdMoment;
  status: SlotStatus;
  eters: number;
  toewijzingen: MaaltijdToewijzing[];
};

export type DagOverzicht = {
  dag: string;
  gesloten: boolean;
  slots: MaaltijdSlot[];
};

export function capitalize(tekst: string): string {
  return tekst.length === 0 ? tekst : tekst[0].toUpperCase() + tekst.slice(1);
}
