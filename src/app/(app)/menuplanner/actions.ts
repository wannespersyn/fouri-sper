"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiefKamp } from "@/lib/data/kamp";
import { formString, formStrings } from "@/lib/form";
import type { MaaltijdMoment } from "@/lib/menuplanner-shared";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function vereisActiefKamp() {
  const kamp = await getActiefKamp();
  if (!kamp) throw new Error("Geen actief kamp.");
  return kamp;
}

// De maaltijd (dag × moment) wordt lui aangemaakt, pas op het moment dat er
// effectief een gerecht aan toegewezen wordt — net als de andere plekken die
// maaltijd-rijen materialiseren (Groepen/Activiteiten), maar hier voor één
// specifiek moment in plaats van alle zes tegelijk.
async function ensureMaaltijdId(supabase: SupabaseClient, kampId: string, dag: string, moment: string) {
  const { data: bestaand } = await supabase
    .from("maaltijd")
    .select("id")
    .eq("kamp_id", kampId)
    .eq("dag", dag)
    .eq("moment", moment)
    .maybeSingle();
  if (bestaand) return bestaand.id as string;

  const { data: nieuw, error } = await supabase
    .from("maaltijd")
    .insert({ kamp_id: kampId, dag, moment })
    .select("id")
    .single();
  if (error || !nieuw) throw new Error(error?.message ?? "Aanmaken van maaltijd mislukt.");
  return nieuw.id as string;
}

export async function assignRecept(formData: FormData) {
  const kamp = await vereisActiefKamp();

  const dag = formString(formData, "dag");
  const moment = formString(formData, "moment") as MaaltijdMoment;
  const receptId = formString(formData, "recept_id");
  const groepIds = formStrings(formData, "groep_id");
  if (!dag || !moment || !receptId || groepIds.length === 0) return;

  const supabase = await createClient();
  const maaltijdId = await ensureMaaltijdId(supabase, kamp.id, dag, moment);

  const { data: toewijzing, error } = await supabase
    .from("maaltijd_toewijzing")
    .insert({ kamp_id: kamp.id, maaltijd_id: maaltijdId, recept_id: receptId })
    .select("id")
    .single();
  if (error || !toewijzing) throw new Error(error?.message ?? "Toewijzen van gerecht mislukt.");

  await supabase
    .from("maaltijd_toewijzing_groep")
    .insert(groepIds.map((groepId) => ({ toewijzing_id: toewijzing.id, groep_id: groepId })));

  revalidatePath("/menuplanner");
}

export async function removeToewijzing(formData: FormData) {
  const id = formString(formData, "id");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("maaltijd_toewijzing").delete().eq("id", id);

  revalidatePath("/menuplanner");
}
