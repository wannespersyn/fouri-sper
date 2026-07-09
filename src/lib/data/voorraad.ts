import { createClient } from "@/lib/supabase/server";
import type { Eenheid } from "@/lib/recepten-shared";
import type { VoorraadRij } from "@/lib/voorraad-shared";

// Alle ingrediënten van het kamp, elk met hun huidige voorraad (0 als er nog
// nooit geteld is). Twee losse queries + een merge in JS, zelfde patroon als
// getLeveranciersMetIngredienten — geen embedded select, want ingredient en
// voorraad hebben geen FK naar elkaar toe (voorraad.ingredient_id wijst naar
// ingredient, niet omgekeerd).
export async function getVoorraadOverzicht(kampId: string): Promise<VoorraadRij[]> {
  const supabase = await createClient();

  const [ingredientenRes, voorraadRes] = await Promise.all([
    supabase
      .from("ingredient")
      .select("id, naam, eenheid, categorie")
      .eq("kamp_id", kampId)
      .order("naam", { ascending: true }),
    supabase
      .from("voorraad")
      .select("ingredient_id, hoeveelheid, bijgewerkt_op")
      .eq("kamp_id", kampId),
  ]);

  const ingredienten = ingredientenRes.data ?? [];
  const voorraadByIngredient = new Map(
    (voorraadRes.data ?? []).map((v) => [v.ingredient_id, v])
  );

  return ingredienten.map((i) => {
    const v = voorraadByIngredient.get(i.id);
    return {
      ingredientId: i.id,
      naam: i.naam,
      eenheid: i.eenheid as Eenheid,
      categorie: i.categorie,
      hoeveelheid: v?.hoeveelheid ?? 0,
      bijgewerktOp: v?.bijgewerkt_op ?? null,
    };
  });
}
