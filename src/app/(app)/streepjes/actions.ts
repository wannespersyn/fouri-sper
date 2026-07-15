"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiefKamp } from "@/lib/data/kamp";
import { formString } from "@/lib/form";

export async function addStreepje(formData: FormData) {
  const kamp = await getActiefKamp();
  if (!kamp) return;

  const streepjePersoonId = formString(formData, "streepje_persoon_id");
  const streepjeTypeId = formString(formData, "streepje_type_id");
  if (!streepjePersoonId || !streepjeTypeId) return;

  const supabase = await createClient();
  await supabase.from("streepje").insert({
    kamp_id: kamp.id,
    streepje_persoon_id: streepjePersoonId,
    streepje_type_id: streepjeTypeId,
  });

  revalidatePath("/streepjes");
}

// Verwijdert het laatst toegevoegde streepje voor deze combinatie i.p.v. een
// specifiek id mee te geven — de UI toont enkel totalen per type, geen
// individuele streepjes, dus "verwijder er één" betekent hier "het laatste".
export async function removeStreepje(formData: FormData) {
  const kamp = await getActiefKamp();
  if (!kamp) return;

  const streepjePersoonId = formString(formData, "streepje_persoon_id");
  const streepjeTypeId = formString(formData, "streepje_type_id");
  if (!streepjePersoonId || !streepjeTypeId) return;

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
  if (!laatste) return;

  await supabase.from("streepje").delete().eq("id", laatste.id);

  revalidatePath("/streepjes");
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
