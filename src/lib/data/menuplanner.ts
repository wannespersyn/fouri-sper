import { createClient } from "@/lib/supabase/server";
import { weekdagVan } from "@/lib/date";
import { MAALTIJD_MOMENTEN, slotStatus } from "@/lib/menuplanner-shared";
import type { DagOverzicht, MaaltijdToewijzing, ToewijzingGroep } from "@/lib/menuplanner-shared";

// Eén query voor de hele kampperiode — een kamp duurt hooguit een paar
// weken, dus dit is een beperkte dataset. Alle statuslogica (eters,
// ontbrekende diëten) komt rechtstreeks uit v_prep_planning; hier gebeurt
// enkel het groeperen per dag/moment en het bijvoegen van de groep-kleuren
// (die de view zelf niet meegeeft, enkel de namen).
export async function getMenuplannerOverzicht(kampId: string, dagen: string[]): Promise<DagOverzicht[]> {
  const supabase = await createClient();

  const [planningRes, feestdagenRes, groepenRes, aanwezigheidRes] = await Promise.all([
    supabase
      .from("v_prep_planning")
      .select("toewijzing_id, dag, moment, recept_id, recept_naam, eters, ontbrekende_dieten, status_ok")
      .eq("kamp_id", kampId),
    dagen.length > 0
      ? supabase.from("belgische_feestdag").select("datum").gte("datum", dagen[0]).lte("datum", dagen[dagen.length - 1])
      : Promise.resolve({ data: [] as { datum: string }[] }),
    supabase
      .from("maaltijd_toewijzing_groep")
      .select("toewijzing_id, groep:groep_id(id, naam, kleur), toewijzing:toewijzing_id!inner(kamp_id)")
      .eq("toewijzing.kamp_id", kampId),
    supabase
      .from("v_aanwezigheid")
      .select("dag, moment, groep_id")
      .eq("kamp_id", kampId)
      .eq("groep_afwezig", true),
  ]);

  const feestdagen = new Set((feestdagenRes.data ?? []).map((f) => f.datum));

  // Groepen zonder rij hier zijn nooit expliciet afwezig gezet voor dit
  // moment (geen dagje-af, geen activiteit) — die tellen dus als aanwezig,
  // gebruikt om de groepenkiezer in de maaltijd-modal voor te selecteren.
  const afwezigePerDagMoment = new Map<string, Set<string>>();
  for (const row of aanwezigheidRes.data ?? []) {
    const key = `${row.dag}|${row.moment}`;
    const set = afwezigePerDagMoment.get(key) ?? new Set<string>();
    set.add(row.groep_id);
    afwezigePerDagMoment.set(key, set);
  }

  const groepenPerToewijzing = new Map<string, ToewijzingGroep[]>();
  for (const row of groepenRes.data ?? []) {
    const groep = row.groep as unknown as ToewijzingGroep | null;
    if (!groep) continue;
    const lijst = groepenPerToewijzing.get(row.toewijzing_id) ?? [];
    lijst.push(groep);
    groepenPerToewijzing.set(row.toewijzing_id, lijst);
  }

  const toewijzingenPerDagMoment = new Map<string, MaaltijdToewijzing[]>();
  for (const row of planningRes.data ?? []) {
    const toewijzing: MaaltijdToewijzing = {
      id: row.toewijzing_id,
      recept_id: row.recept_id,
      recept_naam: row.recept_naam,
      eters: row.eters ?? 0,
      groepen: groepenPerToewijzing.get(row.toewijzing_id) ?? [],
      ontbrekendeDieten: row.ontbrekende_dieten ?? [],
      statusOk: row.status_ok,
    };
    const key = `${row.dag}|${row.moment}`;
    const lijst = toewijzingenPerDagMoment.get(key) ?? [];
    lijst.push(toewijzing);
    toewijzingenPerDagMoment.set(key, lijst);
  }

  return dagen.map((dag) => {
    const gesloten = weekdagVan(dag) === 0 || feestdagen.has(dag);
    const slots = MAALTIJD_MOMENTEN.map((m) => {
      const toewijzingen = toewijzingenPerDagMoment.get(`${dag}|${m.value}`) ?? [];
      return {
        moment: m.value,
        status: slotStatus(toewijzingen),
        eters: toewijzingen.reduce((som, t) => som + t.eters, 0),
        toewijzingen,
        afwezigeGroepIds: [...(afwezigePerDagMoment.get(`${dag}|${m.value}`) ?? [])],
      };
    });
    return { dag, gesloten, slots };
  });
}
