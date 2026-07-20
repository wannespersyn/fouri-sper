import { createClient } from "@/lib/supabase/server";
import type { StreepjePersoon, StreepjeRuw, StreepjeType } from "@/lib/streepjes-shared";
import { SHUSS_OPROEP_ACTIEF_MS, type HuidigeShussOproep } from "@/lib/shuss-shared";

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

// Laatste shuss-oproep binnen het "actieve" venster, met de ja-teller en de
// eigen reactie erbij. Namen van andere leden komen niet uit auth.users
// (vereist admin-client) maar uit de gedenormaliseerde afzender_naam op de
// oproep zelf.
export async function getHuidigeShussOproep(kampId: string): Promise<HuidigeShussOproep | null> {
  const supabase = await createClient();
  const [{ data: oproep }, { data: userData }] = await Promise.all([
    supabase
      .from("shuss_oproep")
      .select("id, afzender_id, afzender_naam, created_at")
      .eq("kamp_id", kampId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);
  if (!oproep) return null;
  if (Date.now() - new Date(oproep.created_at).getTime() > SHUSS_OPROEP_ACTIEF_MS) return null;

  const gebruikerId = userData.user?.id;
  const { data: reacties } = await supabase
    .from("shuss_oproep_reactie")
    .select("gebruiker_id, reactie")
    .eq("oproep_id", oproep.id);

  const aantalJa = (reacties ?? []).filter((r) => r.reactie === "ja").length;
  const eigenReactie = (reacties ?? []).find((r) => r.gebruiker_id === gebruikerId)?.reactie ?? null;

  return {
    id: oproep.id,
    afzenderNaam: oproep.afzender_naam,
    isEigenOproep: oproep.afzender_id === gebruikerId,
    aantalJa,
    eigenReactie: eigenReactie as "ja" | "nee" | null,
  };
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
