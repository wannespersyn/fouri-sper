import { createClient } from "@/lib/supabase/server";
import type { Activiteit, DagMomenten, MaaltijdMoment } from "@/lib/activiteiten-shared";
import { MAALTIJD_MOMENTEN } from "@/lib/activiteiten-shared";

// Server-only: re-exported here so server files (page.tsx, actions.ts) can
// import everything activiteit-related from one place. Client Components
// must import from lib/activiteiten-shared directly — see that file for why.
export type { Activiteit, DagMomenten, MaaltijdMoment };
export { MAALTIJD_MOMENTEN, MAALTIJD_MOMENT_LABEL, formatActiviteitPeriode } from "@/lib/activiteiten-shared";

export async function getActiviteitenMetDetails(kampId: string): Promise<Activiteit[]> {
  const supabase = await createClient();

  const [activiteitenRes, momentenRes, afwezigheidRes] = await Promise.all([
    supabase
      .from("activiteit")
      .select("id, naam, groep_id, van_datum, tot_datum, kleur, groep:groep_id(naam, kleur, basis_aantal)")
      .eq("kamp_id", kampId)
      .order("van_datum", { ascending: true }),
    supabase.from("activiteit_maaltijd_moment").select("activiteit_id, dag, moment"),
    supabase
      .from("afwezigheid")
      .select("activiteit_id")
      .eq("kamp_id", kampId)
      .not("activiteit_id", "is", null),
  ]);

  const activiteiten = activiteitenRes.data ?? [];
  const momenten = momentenRes.data ?? [];
  const afwezigheid = afwezigheidRes.data ?? [];
  const momentVolgorde = MAALTIJD_MOMENTEN.map((m) => m.value);

  return activiteiten.map((a) => {
    const groep = a.groep as unknown as { naam: string; kleur: string; basis_aantal: number } | null;
    const eigenMomenten = momenten.filter((m) => m.activiteit_id === a.id);

    const perDagMap = new Map<string, Set<MaaltijdMoment>>();
    for (const m of eigenMomenten) {
      const set = perDagMap.get(m.dag) ?? new Set<MaaltijdMoment>();
      set.add(m.moment as MaaltijdMoment);
      perDagMap.set(m.dag, set);
    }
    const momentenPerDag: DagMomenten[] = [...perDagMap.entries()]
      .sort(([dagA], [dagB]) => (dagA < dagB ? -1 : 1))
      .map(([dag, set]) => ({ dag, momenten: momentVolgorde.filter((m) => set.has(m)) }));

    const unieMomenten = new Set(eigenMomenten.map((m) => m.moment as MaaltijdMoment));

    return {
      id: a.id,
      naam: a.naam,
      groep_id: a.groep_id,
      groep_naam: groep?.naam ?? "onbekende groep",
      groep_kleur: groep?.kleur ?? "#6f7d72",
      groep_basis_aantal: groep?.basis_aantal ?? 0,
      van_datum: a.van_datum,
      tot_datum: a.tot_datum,
      kleur: a.kleur,
      momenten: momentVolgorde.filter((m) => unieMomenten.has(m)),
      momentenPerDag,
      geraakteMaaltijden: afwezigheid.filter((x) => x.activiteit_id === a.id).length,
    };
  });
}
