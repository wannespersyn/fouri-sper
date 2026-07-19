import { createClient } from "@/lib/supabase/server";
import type { StreepjePersoon, StreepjeRuw, StreepjeType } from "@/lib/streepjes-shared";

export async function getStreepjesPersonen(kampId: string): Promise<StreepjePersoon[]> {
  const supabase = await createClient();
  const [{ data: personen }, { data: userData }] = await Promise.all([
    supabase
      .from("streepje_persoon")
      .select("id, naam, bio, foto_url")
      .eq("kamp_id", kampId)
      .order("naam", { ascending: true }),
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

  return (personen ?? []).map((p) => ({
    id: p.id,
    naam: p.naam,
    bio: p.bio,
    fotoUrl: p.foto_url,
    favoriet: favorietIds.has(p.id),
  }));
}

export async function getStreepjePersoon(kampId: string, persoonId: string): Promise<StreepjePersoon | null> {
  const supabase = await createClient();
  const { data: p } = await supabase
    .from("streepje_persoon")
    .select("id, naam, bio, foto_url")
    .eq("kamp_id", kampId)
    .eq("id", persoonId)
    .maybeSingle();
  if (!p) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let favoriet = false;
  if (user) {
    const { data: fav } = await supabase
      .from("streepje_persoon_favoriet")
      .select("streepje_persoon_id")
      .eq("streepje_persoon_id", persoonId)
      .eq("gebruiker_id", user.id)
      .maybeSingle();
    favoriet = !!fav;
  }

  return { id: p.id, naam: p.naam, bio: p.bio, fotoUrl: p.foto_url, favoriet };
}

export async function getStreepjeTypes(kampId: string): Promise<StreepjeType[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("streepje_type")
    .select("id, naam, kleur, gewicht")
    .eq("kamp_id", kampId)
    .order("volgorde", { ascending: true });
  return data ?? [];
}

// Aggregeert in JS i.p.v. een SQL-groepering — het aantal streepjes per kamp
// blijft klein genoeg (een zomerkamp, geen jaaromzet) om gewoon alle rijen op
// te halen en hier te tellen, net als de aanwezigheid-aggregatie in groepen.ts.
// Basis voor leaderboards en het per-dag overzicht, die de streepjes moeten
// kunnen groeperen per streepjesdag (8u-8u).
export async function getStreepjesRuw(kampId: string): Promise<StreepjeRuw[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("streepje")
    .select("streepje_persoon_id, streepje_type_id, created_at")
    .eq("kamp_id", kampId);
  return data ?? [];
}
