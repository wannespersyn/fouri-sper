// Types, constants and pure formatting helpers for activiteiten — split out
// from lib/data/activiteiten.ts so Client Components can import them without
// dragging in the server-only Supabase client (next/headers breaks the
// client bundle otherwise). Anything that touches the database belongs in
// lib/data/activiteiten.ts, not here.
import { MAAND_KORT, getDagenBereik } from "@/lib/date";

export type MaaltijdMoment =
  | "ontbijt"
  | "middag"
  | "vieruurtje"
  | "avond"
  | "tienuurtje"
  | "middernacht_snack";

// Same order as the maaltijd_moment enum and the Menuplanner's slot order.
export const MAALTIJD_MOMENTEN: { value: MaaltijdMoment; label: string }[] = [
  { value: "ontbijt", label: "Ontbijt" },
  { value: "middag", label: "Middag" },
  { value: "vieruurtje", label: "4-uurtje" },
  { value: "avond", label: "Avondeten" },
  { value: "tienuurtje", label: "10-uurtje" },
  { value: "middernacht_snack", label: "Middernachtsnack" },
];

export const MAALTIJD_MOMENT_LABEL: Record<MaaltijdMoment, string> = Object.fromEntries(
  MAALTIJD_MOMENTEN.map((m) => [m.value, m.label])
) as Record<MaaltijdMoment, string>;

export type DagMomenten = { dag: string; momenten: MaaltijdMoment[] };

export type Activiteit = {
  id: string;
  naam: string;
  groep_id: string;
  groep_naam: string;
  groep_kleur: string;
  groep_basis_aantal: number;
  van_datum: string;
  tot_datum: string;
  kleur: string;
  // Unie van alle momenten die op minstens één dag gekozen zijn — voor de
  // samenvattingslabel op de kaart. Voor de werkelijke keuze per dag, zie
  // momentenPerDag.
  momenten: MaaltijdMoment[];
  momentenPerDag: DagMomenten[];
  // Aantal daadwerkelijk geraakte maaltijdmomenten (dagen × momenten),
  // rechtstreeks geteld uit de gematerialiseerde afwezigheid-rijen.
  geraakteMaaltijden: number;
};

export function formatActiviteitPeriode(vanIso: string, totIso: string) {
  const dagen = getDagenBereik(vanIso, totIso).length;
  const [vj, vm, vd] = vanIso.split("-").map(Number);
  const [tj, tm, td] = totIso.split("-").map(Number);
  const duurLabel = dagen === 1 ? "1 dag" : `${dagen} dagen`;
  if (vanIso === totIso) {
    return `${duurLabel} · ${vd} ${MAAND_KORT[vm - 1]}`;
  }
  if (vj === tj && vm === tm) {
    return `${duurLabel} · ${vd}–${td} ${MAAND_KORT[tm - 1]}`;
  }
  return `${duurLabel} · ${vd} ${MAAND_KORT[vm - 1]} – ${td} ${MAAND_KORT[tm - 1]}`;
}
