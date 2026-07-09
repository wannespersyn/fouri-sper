"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiefKamp } from "@/lib/data/kamp";
import { formString } from "@/lib/form";
import type { LeverancierType } from "@/lib/leveranciers-shared";
import type { Eenheid } from "@/lib/recepten-shared";

async function vereisActiefKamp() {
  const kamp = await getActiefKamp();
  if (!kamp) throw new Error("Geen actief kamp.");
  return kamp;
}

export async function createLeverancier(formData: FormData) {
  const kamp = await vereisActiefKamp();
  const supabase = await createClient();

  const naam = formString(formData, "naam").trim();
  const type = (formString(formData, "type") || null) as LeverancierType | null;
  const contactInfo = formString(formData, "contact_info").trim() || null;
  const besteldeadlineDagen = Math.max(0, Number(formString(formData, "besteldeadline_dagen") || 0));
  const kleur = formString(formData, "kleur") || "#c8763a";
  if (!naam) return;

  await supabase.from("leverancier").insert({
    kamp_id: kamp.id,
    naam,
    type,
    contact_info: contactInfo,
    besteldeadline_dagen: besteldeadlineDagen,
    kleur,
  });

  revalidatePath("/leveranciers");
}

export async function updateLeverancier(formData: FormData) {
  const id = formString(formData, "id");
  const naam = formString(formData, "naam").trim();
  const type = (formString(formData, "type") || null) as LeverancierType | null;
  const contactInfo = formString(formData, "contact_info").trim() || null;
  const besteldeadlineDagen = Math.max(0, Number(formString(formData, "besteldeadline_dagen") || 0));
  const kleur = formString(formData, "kleur") || "#c8763a";
  if (!id || !naam) return;

  const supabase = await createClient();
  await supabase
    .from("leverancier")
    .update({
      naam,
      type,
      contact_info: contactInfo,
      besteldeadline_dagen: besteldeadlineDagen,
      kleur,
    })
    .eq("id", id);

  revalidatePath("/leveranciers");
}

export async function deleteLeverancier(formData: FormData) {
  const id = formString(formData, "id");
  if (!id) return;

  const supabase = await createClient();
  // ingredient.leverancier_id staat op "on delete set null" — gelinkte
  // ingrediënten blijven dus gewoon bestaan, maar vallen terug naar "niet
  // toegewezen" in plaats van mee verwijderd te worden.
  await supabase.from("leverancier").delete().eq("id", id);

  revalidatePath("/leveranciers");
}

// Volledige bewerking van een bestaand ingrediënt: naam, eenheid, categorie,
// verpakkingsgrootte en de gekoppelde leverancier (leeg = niet toegewezen).
// Nieuwe ingrediënten aanmaken gebeurt nog steeds via de Recepten-pagina.
export async function updateIngredient(formData: FormData) {
  const id = formString(formData, "id");
  const naam = formString(formData, "naam").trim();
  if (!id || !naam) return;

  const eenheid = (formString(formData, "eenheid") || "g") as Eenheid;
  const categorie = formString(formData, "categorie").trim() || null;
  const verpakkingsgrootteRaw = formString(formData, "verpakkingsgrootte").trim();
  const verpakkingsgrootte = verpakkingsgrootteRaw ? Number(verpakkingsgrootteRaw) : null;
  const leverancierId = formString(formData, "leverancier_id") || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("ingredient")
    .update({
      naam,
      eenheid,
      categorie,
      verpakkingsgrootte: verpakkingsgrootte && verpakkingsgrootte > 0 ? verpakkingsgrootte : null,
      leverancier_id: leverancierId,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/leveranciers");
  revalidatePath("/recepten");
}
