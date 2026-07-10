"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiefKamp } from "@/lib/data/kamp";
import { formString, formStrings } from "@/lib/form";

// Bestelling plaatsen voor één leverancier op één besteldag: de huidige
// live-berekende regels (netto hoeveelheid per ingrediënt) worden als
// momentopname weggeschreven in aankoop, zodat je later nog ziet wat je
// effectief besteld hebt — ook als voorraad of menuplanning nadien wijzigt.
// Upsert op de (kamp_id, besteldag, leverancier_id) unique constraint, dus
// nogmaals bestellen op dezelfde dag overschrijft gewoon de vorige regels.
export async function plaatsBestelling(formData: FormData) {
  const kamp = await getActiefKamp();
  if (!kamp) throw new Error("Geen actief kamp.");

  const besteldag = formString(formData, "besteldag");
  const dektTot = formString(formData, "dekt_tot");
  const leverancierId = formString(formData, "leverancier_id");
  if (!besteldag || !dektTot || !leverancierId) return;

  const ingredientIds = formStrings(formData, "ingredient_id");
  const hoeveelheden = formStrings(formData, "hoeveelheid");

  const supabase = await createClient();

  const { data: lijst, error: lijstError } = await supabase
    .from("boodschappenlijst")
    .upsert(
      {
        kamp_id: kamp.id,
        besteldag,
        dekt_tot: dektTot,
        leverancier_id: leverancierId,
        status: "besteld",
      },
      { onConflict: "kamp_id,besteldag,leverancier_id" }
    )
    .select("id")
    .single();
  if (lijstError || !lijst) throw new Error(lijstError?.message ?? "Bestelling plaatsen mislukt.");

  await supabase.from("aankoop").delete().eq("boodschappenlijst_id", lijst.id);

  const aankopen = ingredientIds
    .map((ingredientId, i) => ({
      boodschappenlijst_id: lijst.id,
      ingredient_id: ingredientId,
      hoeveelheid: Number(hoeveelheden[i]),
    }))
    .filter((a) => Number.isFinite(a.hoeveelheid) && a.hoeveelheid > 0);

  if (aankopen.length > 0) {
    const { error: aankoopError } = await supabase.from("aankoop").insert(aankopen);
    if (aankoopError) throw new Error(aankoopError.message);
  }

  revalidatePath("/boodschappen");
}

export async function markeerGeleverd(formData: FormData) {
  const id = formString(formData, "id");
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("boodschappenlijst").update({ status: "geleverd" }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/boodschappen");
}
