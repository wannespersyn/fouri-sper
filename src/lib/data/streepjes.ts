import { createClient } from "@/lib/supabase/server";
import type { StreepjePersoon, StreepjeTellingen, StreepjeType } from "@/lib/streepjes-shared";

export async function getStreepjesPersonen(kampId: string): Promise<StreepjePersoon[]> {
  const supabase = await createClient();
  const [{ data: personen }, { data: userData }] = await Promise.all([
    supabase.from("streepje_persoon").select("id, naam").eq("kamp_id", kampId).order("naam", { ascending: true }),
    supabase.auth.getUser(),
  ]);

  const gebruikerId = userData.user?.id;
  let favorietIds = new Set<string>();
  if (gebruikerId) {
    const { data: favorieten } = await supabase
      .from("streepje_persoon_favoriet")
      .select("streepje_persoon_id")
      .eq("gebruiker_id", gebruikerId);
    favorietIds = new Set((favorieten ?? []).map((f) => f.streepje_persoon_id));
  }

  return (personen ?? []).map((p) => ({ ...p, favoriet: favorietIds.has(p.id) }));
}

export async function getStreepjeTypes(kampId: string): Promise<StreepjeType[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("streepje_type")
    .select("id, naam, kleur")
    .eq("kamp_id", kampId)
    .order("volgorde", { ascending: true });
  return data ?? [];
}

// Aggregeert in JS i.p.v. een SQL-groepering — het aantal streepjes per kamp
// blijft klein genoeg (een zomerkamp, geen jaaromzet) om gewoon alle rijen op
// te halen en hier te tellen, net als de aanwezigheid-aggregatie in groepen.ts.
export async function getStreepjeTellingen(kampId: string): Promise<StreepjeTellingen> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("streepje")
    .select("streepje_persoon_id, streepje_type_id")
    .eq("kamp_id", kampId);

  const tellingen: StreepjeTellingen = {};
  for (const row of data ?? []) {
    const perType = (tellingen[row.streepje_persoon_id] ??= {});
    perType[row.streepje_type_id] = (perType[row.streepje_type_id] ?? 0) + 1;
  }
  return tellingen;
}
