import { createClient } from "@/lib/supabase/server";
import type { Eenheid } from "@/lib/recepten-shared";
import type { IngredientRij, Leverancier, LeverancierType } from "@/lib/leveranciers-shared";

export async function getLeveranciersMetIngredienten(kampId: string): Promise<Leverancier[]> {
  const supabase = await createClient();

  const [leveranciersRes, ingredientenRes] = await Promise.all([
    supabase
      .from("leverancier")
      .select("id, naam, type, contact_info, besteldeadline_dagen, kleur")
      .eq("kamp_id", kampId)
      .order("naam", { ascending: true }),
    supabase
      .from("ingredient")
      .select("id, naam, eenheid, categorie, verpakkingsgrootte, leverancier_id")
      .eq("kamp_id", kampId)
      .not("leverancier_id", "is", null)
      .order("naam", { ascending: true }),
  ]);

  const leveranciers = leveranciersRes.data ?? [];
  const ingredienten = ingredientenRes.data ?? [];

  return leveranciers.map((l) => ({
    id: l.id,
    naam: l.naam,
    type: l.type as LeverancierType | null,
    contact_info: l.contact_info,
    besteldeadline_dagen: l.besteldeadline_dagen,
    kleur: l.kleur,
    ingredienten: ingredienten
      .filter((i) => i.leverancier_id === l.id)
      .map((i) => ({
        id: i.id,
        naam: i.naam,
        eenheid: i.eenheid as Eenheid,
        categorie: i.categorie,
        verpakkingsgrootte: i.verpakkingsgrootte,
      })),
  }));
}

export async function getIngredientenZonderLeverancier(kampId: string): Promise<IngredientRij[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ingredient")
    .select("id, naam, eenheid, categorie, verpakkingsgrootte")
    .eq("kamp_id", kampId)
    .is("leverancier_id", null)
    .order("naam", { ascending: true });

  return (data ?? []).map((i) => ({
    id: i.id,
    naam: i.naam,
    eenheid: i.eenheid as Eenheid,
    categorie: i.categorie,
    verpakkingsgrootte: i.verpakkingsgrootte,
  }));
}
