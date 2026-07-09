"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiefKamp } from "@/lib/data/kamp";
import { formString } from "@/lib/form";
import type { Eenheid, HoeveelheidModus } from "@/lib/recepten-shared";

async function vereisActiefKamp() {
  const kamp = await getActiefKamp();
  if (!kamp) throw new Error("Geen actief kamp.");
  return kamp;
}

export async function createRecept(formData: FormData) {
  const kamp = await vereisActiefKamp();
  const supabase = await createClient();

  const naam = formString(formData, "naam").trim();
  const categorie = formString(formData, "categorie") || null;
  if (!naam) return;

  const { data, error } = await supabase
    .from("recept")
    .insert({ kamp_id: kamp.id, naam, categorie, status: "concept" })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Aanmaken van recept mislukt.");

  revalidatePath("/recepten");
  redirect(`/recepten/${data.id}`);
}

export async function updateReceptMeta(formData: FormData) {
  const id = formString(formData, "id");
  const naam = formString(formData, "naam").trim();
  const categorie = formString(formData, "categorie") || null;
  const status = formString(formData, "status") || "concept";
  if (!id || !naam) return;

  const supabase = await createClient();
  await supabase.from("recept").update({ naam, categorie, status }).eq("id", id);

  revalidatePath("/recepten");
  revalidatePath(`/recepten/${id}`);
}

export async function deleteRecept(formData: FormData) {
  const id = formString(formData, "id");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("recept").delete().eq("id", id);

  revalidatePath("/recepten");
  redirect("/recepten");
}

function parseHoeveelheid(formData: FormData, modus: HoeveelheidModus) {
  const perPersoon = formString(formData, "hoeveelheid_per_persoon");
  const vastTotaal = formString(formData, "vast_totaal");
  if (modus === "vast_totaal") {
    return { hoeveelheid_per_persoon: null, vast_totaal: Number(vastTotaal) || 0 };
  }
  return { hoeveelheid_per_persoon: Number(perPersoon) || 0, vast_totaal: null };
}

// Voegt een receptregel toe — ofwel met een bestaand ingrediënt (ingredient_id
// gezet), ofwel door meteen een nieuw ingrediënt aan te maken (nieuw_naam
// gezet). Eén actie voor beide, want de picker in de UI is één formulier dat
// wisselt tussen "bestaand kiezen" en "nieuw aanmaken".
export async function addIngredientRegel(formData: FormData) {
  const kamp = await vereisActiefKamp();
  const receptId = formString(formData, "recept_id");
  if (!receptId) return;

  const supabase = await createClient();
  let ingredientId = formString(formData, "ingredient_id");

  if (!ingredientId) {
    const nieuwNaam = formString(formData, "nieuw_naam").trim();
    if (!nieuwNaam) return;
    const eenheid = (formString(formData, "nieuw_eenheid") || "g") as Eenheid;
    const leverancierId = formString(formData, "nieuw_leverancier_id") || null;
    const categorie = formString(formData, "nieuw_categorie").trim() || null;

    const { data: nieuwIngredient, error } = await supabase
      .from("ingredient")
      .insert({ kamp_id: kamp.id, naam: nieuwNaam, eenheid, leverancier_id: leverancierId, categorie })
      .select("id")
      .single();
    if (error || !nieuwIngredient) throw new Error(error?.message ?? "Aanmaken van ingrediënt mislukt.");
    ingredientId = nieuwIngredient.id;
  }

  const modus = (formString(formData, "modus") || "per_persoon") as HoeveelheidModus;

  const { count } = await supabase
    .from("recept_ingredient")
    .select("id", { count: "exact", head: true })
    .eq("recept_id", receptId);

  await supabase.from("recept_ingredient").insert({
    recept_id: receptId,
    ingredient_id: ingredientId,
    modus,
    volgorde: count ?? 0,
    ...parseHoeveelheid(formData, modus),
  });

  revalidatePath(`/recepten/${receptId}`);
  revalidatePath("/recepten");
}

export async function updateIngredientRegel(formData: FormData) {
  const id = formString(formData, "id");
  const receptId = formString(formData, "recept_id");
  if (!id || !receptId) return;

  const modus = (formString(formData, "modus") || "per_persoon") as HoeveelheidModus;

  const supabase = await createClient();
  await supabase
    .from("recept_ingredient")
    .update({ modus, ...parseHoeveelheid(formData, modus) })
    .eq("id", id);

  revalidatePath(`/recepten/${receptId}`);
}

export async function removeIngredientRegel(formData: FormData) {
  const id = formString(formData, "id");
  const receptId = formString(formData, "recept_id");
  if (!id || !receptId) return;

  const supabase = await createClient();
  await supabase.from("recept_ingredient").delete().eq("id", id);

  revalidatePath(`/recepten/${receptId}`);
  revalidatePath("/recepten");
}

// Dieetaanpassing: gewoon een notitie ("altijd al glutenvrij") volstaat om de
// waarschuwing weg te nemen — een concrete vervanging (ingrediënt X wordt Y,
// met een eigen hoeveelheid) is optioneel erbovenop. Vervangende
// ingrediënten kiezen we uit de bestaande ingrediëntenlijst; nieuwe
// ingrediënten maak je eerst aan via de gewone ingrediëntenlijst hierboven.
export async function addDieetAanpassing(formData: FormData) {
  const receptId = formString(formData, "recept_id");
  const dieettypeId = formString(formData, "dieettype_id");
  if (!receptId || !dieettypeId) return;

  const notitie = formString(formData, "notitie").trim() || null;
  const vervangtId = formString(formData, "vervangt_ingredient_id") || null;
  const vervangenDoorId = formString(formData, "vervangen_door_ingredient_id") || null;
  const modusRaw = formString(formData, "modus");
  const modus = modusRaw === "per_persoon" || modusRaw === "vast_totaal" ? modusRaw : null;

  if (!notitie && !vervangenDoorId) return;

  const supabase = await createClient();
  await supabase.from("recept_dieet_aanpassing").insert({
    recept_id: receptId,
    dieettype_id: dieettypeId,
    vervangt_ingredient_id: vervangtId,
    vervangen_door_ingredient_id: vervangenDoorId,
    modus,
    ...(modus ? parseHoeveelheid(formData, modus) : { hoeveelheid_per_persoon: null, vast_totaal: null }),
    notitie,
  });

  revalidatePath(`/recepten/${receptId}`);
  revalidatePath("/recepten");
}

// Snelle bevestiging: "dit recept is oké zo voor dit dieet", zonder dat je
// per se een notitie of vervanging moet intypen. Het loutere bestaan van een
// rij hier is genoeg om de waarschuwing weg te halen (zie v_recept_status).
export async function markDieetOk(formData: FormData) {
  const receptId = formString(formData, "recept_id");
  const dieettypeId = formString(formData, "dieettype_id");
  if (!receptId || !dieettypeId) return;

  const supabase = await createClient();
  await supabase.from("recept_dieet_aanpassing").insert({
    recept_id: receptId,
    dieettype_id: dieettypeId,
  });

  revalidatePath(`/recepten/${receptId}`);
  revalidatePath("/recepten");
}

export async function removeDieetAanpassing(formData: FormData) {
  const id = formString(formData, "id");
  const receptId = formString(formData, "recept_id");
  if (!id || !receptId) return;

  const supabase = await createClient();
  await supabase.from("recept_dieet_aanpassing").delete().eq("id", id);

  revalidatePath(`/recepten/${receptId}`);
  revalidatePath("/recepten");
}
