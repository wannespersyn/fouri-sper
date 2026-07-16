import { createClient } from "@/lib/supabase/server";
import type { ShussGebeurtenis } from "@/lib/shuss-shared";

// Zelfde schaal-argument als getStreepjesRuw: het aantal Shuss-gebeurtenissen
// per kamp blijft klein genoeg om alles op te halen en client-side te tellen.
export async function getShussGebeurtenissen(kampId: string): Promise<ShussGebeurtenis[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shuss_gebeurtenis")
    .select("streepje_persoon_id, soort")
    .eq("kamp_id", kampId);
  return data ?? [];
}
