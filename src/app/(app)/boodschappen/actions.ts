"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiefKamp } from "@/lib/data/kamp";
import { formString } from "@/lib/form";

// Vinkt een ingrediënt van een gerecht aan/af voor een besteldag — een
// informele checklist (bv. voor dingen die al op voorhand gehaald zijn),
// presence-is-waar net als afwezigheid: geen rij verwijderen als "huidig" al
// afgevinkt was, anders toevoegen.
export async function toggleAfgevinkt(formData: FormData) {
  const kamp = await getActiefKamp();
  if (!kamp) throw new Error("Geen actief kamp.");

  const besteldag = formString(formData, "besteldag");
  const receptId = formString(formData, "recept_id");
  const ingredientId = formString(formData, "ingredient_id");
  const huidig = formString(formData, "huidig") === "true";
  if (!besteldag || !receptId || !ingredientId) return;

  const supabase = await createClient();

  if (huidig) {
    const { error } = await supabase
      .from("boodschappen_afgevinkt")
      .delete()
      .eq("kamp_id", kamp.id)
      .eq("besteldag", besteldag)
      .eq("recept_id", receptId)
      .eq("ingredient_id", ingredientId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("boodschappen_afgevinkt")
      .upsert(
        { kamp_id: kamp.id, besteldag, recept_id: receptId, ingredient_id: ingredientId },
        { onConflict: "kamp_id,besteldag,recept_id,ingredient_id" }
      );
    if (error) throw new Error(error.message);
  }

  revalidatePath("/boodschappen");
}
