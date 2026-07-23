import { createClient } from "@/lib/supabase/server";
import type { ShussGebeurtenis } from "@/lib/shuss-shared";

// Zelfde schaal-argument als getStreepjesRuw: het aantal Shuss-gebeurtenissen
// per kamp blijft klein genoeg om alles op te halen en client-side te tellen.
// Zelfde paginering als daar ook nodig — PostgREST kapt standaard af op 1000
// rijen per call.
export async function getShussGebeurtenissen(kampId: string): Promise<ShussGebeurtenis[]> {
  const supabase = await createClient();
  const PAGINA_GROOTTE = 1000;
  const alles: ShussGebeurtenis[] = [];
  let van = 0;
  for (;;) {
    const { data } = await supabase
      .from("shuss_gebeurtenis")
      .select("streepje_persoon_id, soort")
      .eq("kamp_id", kampId)
      .range(van, van + PAGINA_GROOTTE - 1);
    if (!data || data.length === 0) break;
    alles.push(...data);
    if (data.length < PAGINA_GROOTTE) break;
    van += PAGINA_GROOTTE;
  }
  return alles;
}
