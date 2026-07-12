import { createClient } from "@/lib/supabase/server";

export type Dieettype = { id: string; naam: string; kleur: string };

export type Persoon = {
  id: string;
  naam: string;
  groep_id: string;
  dieettypeIds: string[];
  // Vrije tekst voor allergieën/dieetnotities die niet in een dieettype-tag passen.
  allergieOpmerking: string | null;
  // dag (ISO) -> expliciete override; ontbreekt = volgt de groep die dag
  afwijkingen: Map<string, boolean>;
};

export type Groep = {
  id: string;
  naam: string;
  type: "tak" | "leiding" | "fouri" | "externen";
  basis_aantal: number;
  kleur: string;
  volgorde: number;
  personen: Persoon[];
  // dagen (ISO strings) waarop de hele groep manueel afwezig is gezet
  afwezigeDagen: Set<string>;
};

export async function getGroepenMetDetails(kampId: string): Promise<Groep[]> {
  const supabase = await createClient();

  const [groepenRes, personenRes, afwezigheidRes, overrideRes] = await Promise.all([
    supabase
      .from("groep")
      .select("id, naam, type, basis_aantal, kleur, volgorde")
      .eq("kamp_id", kampId)
      .order("volgorde", { ascending: true }),
    supabase
      .from("persoon")
      .select("id, naam, groep_id, allergie_opmerking, persoon_dieettype(dieettype_id)")
      .eq("kamp_id", kampId)
      .order("naam", { ascending: true }),
    supabase
      .from("afwezigheid")
      .select("groep_id, maaltijd:maaltijd_id(dag)")
      .eq("kamp_id", kampId)
      .is("activiteit_id", null),
    supabase
      .from("persoon_aanwezigheid_override")
      .select("persoon_id, aanwezig, maaltijd:maaltijd_id(dag)")
      .eq("kamp_id", kampId),
  ]);

  const groepen = groepenRes.data ?? [];
  const personen = personenRes.data ?? [];
  const afwezigheid = afwezigheidRes.data ?? [];
  const overrides = overrideRes.data ?? [];

  return groepen.map((g) => {
    const afwezigeDagen = new Set(
      afwezigheid
        .filter((a) => a.groep_id === g.id)
        .map((a) => (a.maaltijd as unknown as { dag: string } | null)?.dag)
        .filter((dag): dag is string => Boolean(dag))
    );

    return {
      ...g,
      personen: personen
        .filter((p) => p.groep_id === g.id)
        .map((p) => {
          const afwijkingen = new Map<string, boolean>();
          for (const o of overrides) {
            if (o.persoon_id !== p.id) continue;
            const dag = (o.maaltijd as unknown as { dag: string } | null)?.dag;
            if (dag) afwijkingen.set(dag, o.aanwezig);
          }
          return {
            id: p.id,
            naam: p.naam,
            groep_id: p.groep_id,
            dieettypeIds: (p.persoon_dieettype as unknown as { dieettype_id: string }[]).map(
              (pd) => pd.dieettype_id
            ),
            allergieOpmerking: p.allergie_opmerking,
            afwijkingen,
          };
        }),
      afwezigeDagen,
    };
  });
}

export async function getDieettypes(): Promise<Dieettype[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dieettype")
    .select("id, naam, kleur")
    .order("naam", { ascending: true });
  return data ?? [];
}

// Lichtgewicht groepenlijst (id/naam/kleur) voor pickers elders — Activiteiten,
// Menuplanner, Recepten — zonder de volledige personen/aanwezigheid mee te laden.
export type GroepOptie = { id: string; naam: string; kleur: string };

export async function getGroepenOpties(kampId: string): Promise<GroepOptie[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("groep")
    .select("id, naam, kleur")
    .eq("kamp_id", kampId)
    .order("volgorde", { ascending: true });
  return data ?? [];
}
