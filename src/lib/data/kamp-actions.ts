"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreateKampState = { error: string | null };

export async function createKamp(
  _prevState: CreateKampState,
  formData: FormData
): Promise<CreateKampState> {
  const naam = String(formData.get("naam") ?? "").trim();
  const startDatum = String(formData.get("start_datum") ?? "");
  const eindDatum = String(formData.get("eind_datum") ?? "");

  if (!naam || !startDatum || !eindDatum) {
    return { error: "Vul een naam en beide data in." };
  }
  if (eindDatum < startDatum) {
    return { error: "Einddatum kan niet voor de startdatum liggen." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("kamp")
    .insert({ naam, start_datum: startDatum, eind_datum: eindDatum, is_actief: true });

  if (error) {
    return { error: "Aanmaken mislukt: " + error.message };
  }

  revalidatePath("/", "layout");
  return { error: null };
}
