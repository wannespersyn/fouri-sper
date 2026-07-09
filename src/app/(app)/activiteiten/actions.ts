"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiefKamp } from "@/lib/data/kamp";
import { formString, formStrings } from "@/lib/form";

async function vereisActiefKamp() {
  const kamp = await getActiefKamp();
  if (!kamp) throw new Error("Geen actief kamp.");
  return kamp;
}

export async function upsertActiviteit(formData: FormData) {
  const kamp = await vereisActiefKamp();

  const id = formString(formData, "id") || null;
  const groepId = formString(formData, "groep_id");
  const naam = formString(formData, "naam").trim();
  const vanDatum = formString(formData, "van_datum");
  const totDatum = formString(formData, "tot_datum");
  const kleur = formString(formData, "kleur") || "#8a5ab0";

  if (!groepId || !naam || !vanDatum || !totDatum) return;
  if (totDatum < vanDatum) return;

  const dagen: Record<string, string[]> = {};
  for (const entry of formStrings(formData, "dagmoment")) {
    const [dag, moment] = entry.split("|");
    if (!dagen[dag]) dagen[dag] = [];
    dagen[dag].push(moment);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("upsert_activiteit", {
    p_id: id,
    p_kamp_id: kamp.id,
    p_groep_id: groepId,
    p_naam: naam,
    p_van_datum: vanDatum,
    p_tot_datum: totDatum,
    p_kleur: kleur,
    p_dagen: dagen,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/activiteiten");
  revalidatePath("/groepen");
  revalidatePath("/menuplanner");
}

export async function deleteActiviteit(formData: FormData) {
  const id = formString(formData, "id");
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("activiteit").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/activiteiten");
  revalidatePath("/groepen");
  revalidatePath("/menuplanner");
}
