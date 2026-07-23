"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiefKamp } from "@/lib/data/kamp";
import { formString } from "@/lib/form";
import { stuurPushNaarAllen } from "@/lib/push/server";

export type StreepjeActieResultaat = { ok: true } | { ok: false; error: string };

export async function addStreepje(formData: FormData): Promise<StreepjeActieResultaat> {
  const kamp = await getActiefKamp();
  if (!kamp) return { ok: false, error: "Geen actief kamp gevonden." };

  const streepjePersoonId = formString(formData, "streepje_persoon_id");
  const streepjeTypeId = formString(formData, "streepje_type_id");
  if (!streepjePersoonId || !streepjeTypeId) return { ok: false, error: "Ontbrekende gegevens." };

  const supabase = await createClient();
  const { error } = await supabase.from("streepje").insert({
    kamp_id: kamp.id,
    streepje_persoon_id: streepjePersoonId,
    streepje_type_id: streepjeTypeId,
  });
  if (error) {
    console.error("addStreepje", error);
    return { ok: false, error: "Kon streepje niet opslaan, probeer opnieuw." };
  }

  revalidatePath("/streepjes");
  return { ok: true };
}

// Verwijdert het laatst toegevoegde streepje voor deze combinatie i.p.v. een
// specifiek id mee te geven — de UI toont enkel totalen per type, geen
// individuele streepjes, dus "verwijder er één" betekent hier "het laatste".
export async function removeStreepje(formData: FormData): Promise<StreepjeActieResultaat> {
  const kamp = await getActiefKamp();
  if (!kamp) return { ok: false, error: "Geen actief kamp gevonden." };

  const streepjePersoonId = formString(formData, "streepje_persoon_id");
  const streepjeTypeId = formString(formData, "streepje_type_id");
  if (!streepjePersoonId || !streepjeTypeId) return { ok: false, error: "Ontbrekende gegevens." };

  const supabase = await createClient();
  const { data } = await supabase
    .from("streepje")
    .select("id")
    .eq("kamp_id", kamp.id)
    .eq("streepje_persoon_id", streepjePersoonId)
    .eq("streepje_type_id", streepjeTypeId)
    .order("created_at", { ascending: false })
    .limit(1);

  const laatste = data?.[0];
  if (!laatste) return { ok: true };

  const { error } = await supabase.from("streepje").delete().eq("id", laatste.id);
  if (error) {
    console.error("removeStreepje", error);
    return { ok: false, error: "Kon streepje niet verwijderen, probeer opnieuw." };
  }

  revalidatePath("/streepjes");
  return { ok: true };
}

export async function addStreepjePersoon(formData: FormData) {
  const kamp = await getActiefKamp();
  if (!kamp) return;

  const naam = formString(formData, "naam").trim();
  if (!naam) return;

  const supabase = await createClient();
  await supabase.from("streepje_persoon").insert({ kamp_id: kamp.id, naam });

  revalidatePath("/streepjes");
}

// Bio en/of foto zijn allebei optioneel — leiding kan een profiel
// stapsgewijs invullen. Bij een nieuwe foto wordt altijd naar hetzelfde pad
// geüpload (upsert), zodat een oude foto vanzelf vervangen wordt i.p.v. dat
// er weesbestanden achterblijven in de bucket.
export async function updateStreepjePersoonProfiel(formData: FormData) {
  const kamp = await getActiefKamp();
  if (!kamp) return;

  const id = formString(formData, "id");
  if (!id) return;
  const bio = formString(formData, "bio").trim();

  const supabase = await createClient();
  const update: { bio: string | null; foto_url?: string } = { bio: bio || null };

  const foto = formData.get("foto");
  if (foto instanceof File && foto.size > 0) {
    const ext = foto.name.split(".").pop()?.toLowerCase() || "jpg";
    const pad = `${id}/foto.${ext}`;
    const { error } = await supabase.storage.from("streepje-fotos").upload(pad, foto, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("streepje-fotos").getPublicUrl(pad);
      update.foto_url = `${data.publicUrl}?v=${Date.now()}`;
    }
  }

  await supabase.from("streepje_persoon").update(update).eq("id", id).eq("kamp_id", kamp.id);

  revalidatePath("/streepjes");
  revalidatePath(`/streepjes/${id}`);
}

export async function addShussGebeurtenis(formData: FormData) {
  const kamp = await getActiefKamp();
  if (!kamp) return;

  const streepjePersoonId = formString(formData, "streepje_persoon_id");
  const soort = formString(formData, "soort");
  if (!streepjePersoonId) return;
  if (soort !== "gewonnen" && soort !== "verloren" && soort !== "adje") return;

  const supabase = await createClient();
  await supabase.from("shuss_gebeurtenis").insert({
    kamp_id: kamp.id,
    streepje_persoon_id: streepjePersoonId,
    soort,
  });

  revalidatePath(`/streepjes/${streepjePersoonId}`);
  revalidatePath("/streepjes/leaderboard");
}

// Verwijdert de laatst toegevoegde gebeurtenis voor deze combinatie i.p.v.
// een specifiek id — zelfde "verwijder er één" model als removeStreepje.
export async function removeShussGebeurtenis(formData: FormData) {
  const kamp = await getActiefKamp();
  if (!kamp) return;

  const streepjePersoonId = formString(formData, "streepje_persoon_id");
  const soort = formString(formData, "soort");
  if (!streepjePersoonId) return;
  if (soort !== "gewonnen" && soort !== "verloren" && soort !== "adje") return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("shuss_gebeurtenis")
    .select("id")
    .eq("kamp_id", kamp.id)
    .eq("streepje_persoon_id", streepjePersoonId)
    .eq("soort", soort)
    .order("created_at", { ascending: false })
    .limit(1);

  const laatste = data?.[0];
  if (!laatste) return;

  await supabase.from("shuss_gebeurtenis").delete().eq("id", laatste.id);

  revalidatePath(`/streepjes/${streepjePersoonId}`);
  revalidatePath("/streepjes/leaderboard");
}

// Wisselende speelse teksten i.p.v. steeds dezelfde melding — anders wordt
// een oproep na een paar keer onzichtbaar ("weer datzelfde bericht").
const SHUSS_OPROEP_TEKSTEN = [
  "Wie gaat me pakken??🍻",
  "Geachtte dieren, kom shussen! 🐶",
  "Usse Usse Usse wie wilt er shussen? 🦀",
];

// Stuurt een pushbericht naar iedereen die geabonneerd is behalve de
// afzender zelf — die weet al dat die wilt shussen. Legt ook een shuss_oproep
// rij aan zodat leden ja/nee kunnen antwoorden (max 4 ja's, zie
// reageerOpShussOproep), met de afzender daar automatisch bij als eerste
// "ja". De naam komt uit het e-mailadres (voor de "@") omdat er geen apart
// naamveld per gebruiker bijgehouden wordt in dit schema, en wordt
// gedenormaliseerd in shuss_oproep opgeslagen zodat andere leden 'm kunnen
// tonen zonder een admin-lookup op auth.users nodig te hebben.
export async function stuurShussOproep() {
  const kamp = await getActiefKamp();
  if (!kamp) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const naam = user.email?.split("@")[0] ?? "Iemand";
  const naamHoofdletter = naam.charAt(0).toUpperCase() + naam.slice(1);
  const tekst = SHUSS_OPROEP_TEKSTEN[Math.floor(Math.random() * SHUSS_OPROEP_TEKSTEN.length)];

  const { data: oproep } = await supabase
    .from("shuss_oproep")
    .insert({ kamp_id: kamp.id, afzender_id: user.id, afzender_naam: naamHoofdletter })
    .select("id")
    .single();

  if (oproep) {
    await supabase.rpc("reageer_op_shuss_oproep", { p_oproep_id: oproep.id, p_reactie: "ja" });
  }

  await stuurPushNaarAllen(
    {
      title: `${naamHoofdletter} wil shussen!`,
      body: tekst,
      url: "/streepjes",
    },
    user.id
  );

  revalidatePath("/streepjes");
}

export type ShussOproepReactieResultaat = { ok: true; aantalJa: number } | { ok: false };

// Ja/nee-antwoord op de huidige shuss-oproep. De cap van 4 ja's wordt
// atomair afgedwongen in de databasefunctie (rij-lock op shuss_oproep), dus
// hier enkel de databasefout vertalen naar "vol" voor de UI.
export async function reageerOpShussOproep(
  oproepId: string,
  reactie: "ja" | "nee"
): Promise<ShussOproepReactieResultaat> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase.rpc("reageer_op_shuss_oproep", { p_oproep_id: oproepId, p_reactie: reactie });
  revalidatePath("/streepjes");
  if (error) return { ok: false };

  const { count } = await supabase
    .from("shuss_oproep_reactie")
    .select("id", { count: "exact", head: true })
    .eq("oproep_id", oproepId)
    .eq("reactie", "ja");

  return { ok: true, aantalJa: count ?? 0 };
}

export async function toggleStreepjePersoonFavoriet(formData: FormData) {
  const id = formString(formData, "id");
  const huidig = formString(formData, "huidig") === "true";
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  if (huidig) {
    await supabase
      .from("streepje_persoon_favoriet")
      .delete()
      .eq("streepje_persoon_id", id)
      .eq("gebruiker_id", user.id);
  } else {
    await supabase.from("streepje_persoon_favoriet").insert({ streepje_persoon_id: id, gebruiker_id: user.id });
  }

  revalidatePath("/streepjes");
}
