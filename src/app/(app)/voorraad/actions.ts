"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiefKamp } from "@/lib/data/kamp";
import { formString } from "@/lib/form";

// Eén ingrediënt telt/bijwerkt — voorraad heeft nog geen rij voor elk
// ingrediënt (die wordt pas aangemaakt zodra iemand het écht telt), dus dit
// is altijd een upsert op de (kamp_id, ingredient_id) unique constraint.
export async function updateVoorraad(formData: FormData) {
  const kamp = await getActiefKamp();
  if (!kamp) throw new Error("Geen actief kamp.");

  const ingredientId = formString(formData, "ingredient_id");
  if (!ingredientId) return;

  const hoeveelheid = Math.max(0, Number(formString(formData, "hoeveelheid") || 0));
  if (!Number.isFinite(hoeveelheid)) return;

  const supabase = await createClient();
  const { error } = await supabase.from("voorraad").upsert(
    {
      kamp_id: kamp.id,
      ingredient_id: ingredientId,
      hoeveelheid,
      bijgewerkt_op: new Date().toISOString(),
    },
    { onConflict: "kamp_id,ingredient_id" }
  );
  if (error) throw new Error(error.message);

  revalidatePath("/voorraad");
}
