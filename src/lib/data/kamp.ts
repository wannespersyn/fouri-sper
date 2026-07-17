import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { MAAND_KORT } from "@/lib/date";

export const KAMP_ACTIEF_TAG = "kamp-actief";

export type ActiefKamp = {
  id: string;
  naam: string;
  start_datum: string;
  eind_datum: string;
};

export function formatDatumBereik(startIso: string, eindIso: string) {
  const [startJaar, startMaand, startDag] = startIso.split("-").map(Number);
  const [eindJaar, eindMaand, eindDag] = eindIso.split("-").map(Number);
  const zelfdeJaar = startJaar === eindJaar;
  const startLabel = `${startDag} ${MAAND_KORT[startMaand - 1]}`;
  const eindLabel = `${eindDag} ${MAAND_KORT[eindMaand - 1]} ${eindJaar}`;
  return zelfdeJaar ? `${startLabel} – ${eindLabel}` : `${startLabel} ${startJaar} – ${eindLabel}`;
}

// Eén kamp per jaar — dit verandert zelden, dus we cachen 'm buiten de
// request om i.p.v. bij elke navigatie opnieuw te bevragen. createKamp()
// maakt deze cache ongeldig via revalidateTag(KAMP_ACTIEF_TAG), maar die
// aanroep werkt alleen binnen dezelfde omgeving (bv. lokaal aanmaken
// revalidate't Vercel's cache niet). De revalidate-tijd hieronder is een
// vangnet zodat zo'n mismatch zichzelf binnen 5 minuten herstelt. Gebruikt
// de admin-client omdat unstable_cache geen request-cookies mag aanraken —
// de rij zelf is niet gebruikersspecifiek, elk account ziet hetzelfde kamp.
export const getActiefKamp = unstable_cache(
  async (): Promise<ActiefKamp | null> => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("kamp")
      .select("id, naam, start_datum, eind_datum")
      .eq("is_actief", true)
      .maybeSingle();

    return data;
  },
  ["kamp-actief"],
  { tags: [KAMP_ACTIEF_TAG], revalidate: 300 }
);
