import { createClient } from "@/lib/supabase/server";
import { getDieettypes } from "@/lib/data/groepen";
import type {
  DieetAanpassingRegel,
  DieetSectie,
  Eenheid,
  HoeveelheidModus,
  IngredientOptie,
  LeverancierOptie,
  ReceptDetail,
  ReceptIngredientRegel,
  ReceptSamenvatting,
  ReceptStatus,
} from "@/lib/recepten-shared";

export async function getReceptenOverzicht(kampId: string): Promise<ReceptSamenvatting[]> {
  const supabase = await createClient();

  const { data: recepten } = await supabase
    .from("recept")
    .select("id, naam, categorie, status")
    .eq("kamp_id", kampId)
    .order("naam", { ascending: true });

  if (!recepten || recepten.length === 0) return [];

  const { data: statusRows } = await supabase
    .from("v_recept_status")
    .select("recept_id, ingredienten_aantal, groepen_ingepland, ontbrekende_dieten_aantal")
    .in("recept_id", recepten.map((r) => r.id));

  const statusById = new Map((statusRows ?? []).map((s) => [s.recept_id, s]));

  return recepten.map((r) => {
    const s = statusById.get(r.id);
    return {
      id: r.id,
      naam: r.naam,
      categorie: r.categorie,
      status: r.status as ReceptStatus,
      ingredientenAantal: s?.ingredienten_aantal ?? 0,
      groepenIngepland: s?.groepen_ingepland ?? 0,
      ontbrekendeDietenAantal: s?.ontbrekende_dieten_aantal ?? 0,
    };
  });
}

// Lichtgewicht receptenlijst (id/naam/categorie) voor de recept-picker in de
// Menuplanner — zonder de status-aggregatie van getReceptenOverzicht erbij
// te moeten laden.
export type ReceptOptie = { id: string; naam: string; categorie: string | null };

export async function getReceptenOpties(kampId: string): Promise<ReceptOptie[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("recept")
    .select("id, naam, categorie")
    .eq("kamp_id", kampId)
    .order("naam", { ascending: true });
  return data ?? [];
}

export async function getIngredientenOpties(kampId: string): Promise<IngredientOptie[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ingredient")
    .select("id, naam, eenheid, leverancier_id, categorie, leverancier:leverancier_id(naam)")
    .eq("kamp_id", kampId)
    .order("naam", { ascending: true });

  return (data ?? []).map((i) => ({
    id: i.id,
    naam: i.naam,
    eenheid: i.eenheid as Eenheid,
    leverancier_id: i.leverancier_id,
    leverancier_naam: (i.leverancier as unknown as { naam: string } | null)?.naam ?? null,
    categorie: i.categorie,
  }));
}

export async function getLeverancierOpties(kampId: string): Promise<LeverancierOptie[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leverancier")
    .select("id, naam")
    .eq("kamp_id", kampId)
    .order("naam", { ascending: true });
  return data ?? [];
}

// Startwaarde voor de "reken voor X eters"-preview op de receptpagina: som
// van basis_aantal over alle groepen, als grove schatting van "heel het
// kamp". Puur een handig startpunt — geen vervanging voor de echte
// v_maaltijd_behoefte-telling zodra een recept effectief ingepland is.
export async function getTotaalBasisAantal(kampId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.from("groep").select("basis_aantal").eq("kamp_id", kampId);
  return (data ?? []).reduce((som, g) => som + (g.basis_aantal ?? 0), 0);
}

export async function getReceptDetail(kampId: string, receptId: string): Promise<ReceptDetail | null> {
  const supabase = await createClient();

  const [receptRes, ingredientenRes, aanpassingenRes, dieettypes, statusRes, personenDietenRes] = await Promise.all([
    supabase.from("recept").select("id, naam, categorie, status").eq("id", receptId).eq("kamp_id", kampId).maybeSingle(),
    supabase
      .from("recept_ingredient")
      .select(
        "id, ingredient_id, modus, hoeveelheid_per_persoon, vast_totaal, volgorde, ingredient:ingredient_id(naam, eenheid, leverancier:leverancier_id(naam))"
      )
      .eq("recept_id", receptId)
      .order("volgorde", { ascending: true }),
    supabase
      .from("recept_dieet_aanpassing")
      .select(
        "id, dieettype_id, vervangt_ingredient_id, vervangen_door_ingredient_id, modus, hoeveelheid_per_persoon, vast_totaal, notitie, vervangt:vervangt_ingredient_id(naam), vervangen_door:vervangen_door_ingredient_id(naam)"
      )
      .eq("recept_id", receptId),
    getDieettypes(),
    supabase
      .from("v_recept_status")
      .select("ingredienten_aantal, groepen_ingepland, ontbrekende_dieten_aantal")
      .eq("recept_id", receptId)
      .maybeSingle(),
    supabase.from("persoon_dieettype").select("dieettype_id, persoon:persoon_id!inner(kamp_id)").eq("persoon.kamp_id", kampId),
  ]);

  const recept = receptRes.data;
  if (!recept) return null;

  const inGebruikIds = new Set((personenDietenRes.data ?? []).map((r) => r.dieettype_id));

  const ingredienten: ReceptIngredientRegel[] = (ingredientenRes.data ?? []).map((row) => {
    const ing = row.ingredient as unknown as { naam: string; eenheid: Eenheid; leverancier: { naam: string } | null } | null;
    return {
      id: row.id,
      ingredient_id: row.ingredient_id,
      ingredient_naam: ing?.naam ?? "?",
      eenheid: ing?.eenheid ?? "g",
      leverancier_naam: ing?.leverancier?.naam ?? null,
      modus: row.modus as HoeveelheidModus,
      hoeveelheid_per_persoon: row.hoeveelheid_per_persoon,
      vast_totaal: row.vast_totaal,
      volgorde: row.volgorde,
    };
  });

  const aanpassingenByDieet = new Map<string, DieetAanpassingRegel[]>();
  for (const row of aanpassingenRes.data ?? []) {
    const vervangt = row.vervangt as unknown as { naam: string } | null;
    const vervangenDoor = row.vervangen_door as unknown as { naam: string } | null;
    const regel: DieetAanpassingRegel = {
      id: row.id,
      dieettype_id: row.dieettype_id,
      vervangt_ingredient_id: row.vervangt_ingredient_id,
      vervangt_ingredient_naam: vervangt?.naam ?? null,
      vervangen_door_ingredient_id: row.vervangen_door_ingredient_id,
      vervangen_door_ingredient_naam: vervangenDoor?.naam ?? null,
      modus: row.modus as HoeveelheidModus | null,
      hoeveelheid_per_persoon: row.hoeveelheid_per_persoon,
      vast_totaal: row.vast_totaal,
      notitie: row.notitie,
    };
    const lijst = aanpassingenByDieet.get(row.dieettype_id) ?? [];
    lijst.push(regel);
    aanpassingenByDieet.set(row.dieettype_id, lijst);
  }

  const dieetSecties: DieetSectie[] = dieettypes
    .map((d) => ({
      dieettype_id: d.id,
      dieettype_naam: d.naam,
      dieettype_kleur: d.kleur,
      inGebruikInKamp: inGebruikIds.has(d.id),
      aanpassingen: aanpassingenByDieet.get(d.id) ?? [],
    }))
    // Alleen tonen wat relevant is: in gebruik in het kamp, of er staat al een aanpassing op.
    .filter((s) => s.inGebruikInKamp || s.aanpassingen.length > 0);

  const status = statusRes.data;

  return {
    id: recept.id,
    naam: recept.naam,
    categorie: recept.categorie,
    status: recept.status as ReceptStatus,
    ingredientenAantal: status?.ingredienten_aantal ?? ingredienten.length,
    groepenIngepland: status?.groepen_ingepland ?? 0,
    ontbrekendeDietenAantal: status?.ontbrekende_dieten_aantal ?? 0,
    ingredienten,
    dieetSecties,
  };
}
