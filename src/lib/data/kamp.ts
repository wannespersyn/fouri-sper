import { createClient } from "@/lib/supabase/server";
import { MAAND_KORT } from "@/lib/date";

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

export async function getActiefKamp(): Promise<ActiefKamp | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("kamp")
    .select("id, naam, start_datum, eind_datum")
    .eq("is_actief", true)
    .maybeSingle();

  return data;
}
