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

export async function createGroep(formData: FormData) {
  const kamp = await vereisActiefKamp();
  const supabase = await createClient();

  const naam = formString(formData, "naam").trim();
  const type = formString(formData, "type") || "tak";
  const basisAantal = Number(formString(formData, "basis_aantal") || 0);
  const kleur = formString(formData, "kleur") || "#2f6d4f";
  if (!naam) return;

  await supabase.from("groep").insert({
    kamp_id: kamp.id,
    naam,
    type,
    basis_aantal: Math.max(0, basisAantal),
    kleur,
  });

  revalidatePath("/groepen");
}

export async function updateGroep(formData: FormData) {
  const id = formString(formData, "id");
  const naam = formString(formData, "naam").trim();
  const type = formString(formData, "type") || "tak";
  const basisAantal = Number(formString(formData, "basis_aantal") || 0);
  const kleur = formString(formData, "kleur") || "#2f6d4f";
  if (!id || !naam) return;

  const supabase = await createClient();
  await supabase
    .from("groep")
    .update({ naam, type, basis_aantal: Math.max(0, basisAantal), kleur })
    .eq("id", id);

  revalidatePath("/groepen");
}

export async function deleteGroep(formData: FormData) {
  const id = formString(formData, "id");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("groep").delete().eq("id", id);

  revalidatePath("/groepen");
}

export async function addPersoon(formData: FormData) {
  const kamp = await vereisActiefKamp();
  const supabase = await createClient();

  const groepId = formString(formData, "groep_id");
  const naam = formString(formData, "naam").trim();
  const dieettypeIds = formStrings(formData, "dieettype_id");
  if (!groepId || !naam) return;

  const { data: persoon, error } = await supabase
    .from("persoon")
    .insert({ kamp_id: kamp.id, groep_id: groepId, naam })
    .select("id")
    .single();

  if (!error && persoon && dieettypeIds.length > 0) {
    await supabase
      .from("persoon_dieettype")
      .insert(dieettypeIds.map((dieettypeId) => ({ persoon_id: persoon.id, dieettype_id: dieettypeId })));
  }

  revalidatePath("/groepen");
}

export async function updatePersoon(formData: FormData) {
  const id = formString(formData, "id");
  const naam = formString(formData, "naam").trim();
  const dieettypeIds = formStrings(formData, "dieettype_id");
  if (!id || !naam) return;

  const supabase = await createClient();
  await supabase.from("persoon").update({ naam }).eq("id", id);

  // Volledige vervanging is simpeler en foutbestendiger dan diffen.
  await supabase.from("persoon_dieettype").delete().eq("persoon_id", id);
  if (dieettypeIds.length > 0) {
    await supabase
      .from("persoon_dieettype")
      .insert(dieettypeIds.map((dieettypeId) => ({ persoon_id: id, dieettype_id: dieettypeId })));
  }

  revalidatePath("/groepen");
}

export async function removePersoon(formData: FormData) {
  const id = formString(formData, "id");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("persoon").delete().eq("id", id);

  revalidatePath("/groepen");
}

export async function toggleDagAanwezigheid(formData: FormData) {
  const kamp = await vereisActiefKamp();
  const groepId = formString(formData, "groep_id");
  const dag = formString(formData, "dag");
  if (!groepId || !dag) return;

  const supabase = await createClient();
  await supabase.rpc("toggle_groep_dag_aanwezigheid", {
    p_kamp_id: kamp.id,
    p_groep_id: groepId,
    p_dag: dag,
  });

  revalidatePath("/groepen");
}

export async function cyclePersoonDagAanwezigheid(formData: FormData) {
  const kamp = await vereisActiefKamp();
  const persoonId = formString(formData, "persoon_id");
  const dag = formString(formData, "dag");
  if (!persoonId || !dag) return;

  const supabase = await createClient();
  await supabase.rpc("cycle_persoon_dag_aanwezigheid", {
    p_kamp_id: kamp.id,
    p_persoon_id: persoonId,
    p_dag: dag,
  });

  revalidatePath("/groepen");
}
