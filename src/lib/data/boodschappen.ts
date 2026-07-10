import { createClient } from "@/lib/supabase/server";
import { weekdagVan, voegDagenToe } from "@/lib/date";
import type {
  BestelDag,
  BoodschappenRegel,
  BoodschappenStatus,
  LeverancierBestelling,
} from "@/lib/boodschappen-shared";
import type { Eenheid } from "@/lib/recepten-shared";

// Zelfde patroon als de Menuplanner: één query voor alle feestdagen in de
// kampperiode, "gesloten" en "bestel voor 2 dagen" worden daarna in JS
// afgeleid — geen aparte databankcall per dag nodig.
export async function getBestelDagen(kampId: string, dagen: string[]): Promise<BestelDag[]> {
  const supabase = await createClient();
  const { data } =
    dagen.length > 0
      ? await supabase
          .from("belgische_feestdag")
          .select("datum")
          .gte("datum", dagen[0])
          .lte("datum", dagen[dagen.length - 1])
      : { data: [] as { datum: string }[] };

  const feestdagen = new Set((data ?? []).map((f) => f.datum));
  const isGesloten = (dag: string) => weekdagVan(dag) === 0 || feestdagen.has(dag);

  return dagen.map((dag) => {
    const morgen = voegDagenToe(dag, 1);
    const bestelVoor2Dagen = !isGesloten(dag) && isGesloten(morgen);
    return {
      dag,
      gesloten: isGesloten(dag),
      bestelVoor2Dagen,
      dektTot: bestelVoor2Dagen ? morgen : dag,
    };
  });
}

// Wat er voor één besteldag effectief besteld moet worden, gegroepeerd per
// leverancier. Het rekenwerk (netto hoeveelheid t.o.v. voorraad, aantal
// verpakkingen, dekt-tot bij een winkelsluiting) gebeurt in
// boodschappenlijst_voor() in de databank — hier gebeurt enkel de groepering
// per leverancier en het koppelen aan een eventueel al geplaatste bestelling.
export async function getBestelling(kampId: string, dag: string): Promise<LeverancierBestelling[]> {
  const supabase = await createClient();

  const [behoefteRes, leveranciersRes, bestellingenRes] = await Promise.all([
    supabase.rpc("boodschappenlijst_voor", { p_kamp_id: kampId, p_besteldag: dag }),
    supabase.from("leverancier").select("id, naam, kleur").eq("kamp_id", kampId),
    supabase
      .from("boodschappenlijst")
      .select("id, leverancier_id, status")
      .eq("kamp_id", kampId)
      .eq("besteldag", dag),
  ]);

  const leveranciersById = new Map((leveranciersRes.data ?? []).map((l) => [l.id, l]));
  const bestellingPerLeverancier = new Map(
    (bestellingenRes.data ?? []).map((b) => [b.leverancier_id as string | null, b])
  );

  const regelsPerLeverancier = new Map<string | null, BoodschappenRegel[]>();
  for (const rij of behoefteRes.data ?? []) {
    const regel: BoodschappenRegel = {
      ingredientId: rij.ingredient_id,
      ingredientNaam: rij.ingredient_naam,
      eenheid: rij.eenheid as Eenheid,
      nettoHoeveelheid: rij.netto_hoeveelheid,
      verpakkingsgrootte: rij.verpakkingsgrootte,
      aantalVerpakkingen: rij.aantal_verpakkingen,
    };
    const key = (rij.leverancier_id as string | null) ?? null;
    const lijst = regelsPerLeverancier.get(key) ?? [];
    lijst.push(regel);
    regelsPerLeverancier.set(key, lijst);
  }

  const groepen: LeverancierBestelling[] = [];
  for (const [leverancierId, regels] of regelsPerLeverancier) {
    const leverancier = leverancierId ? leveranciersById.get(leverancierId) : null;
    const bestelling = bestellingPerLeverancier.get(leverancierId);
    groepen.push({
      leverancierId,
      leverancierNaam: leverancier?.naam ?? "Geen leverancier toegewezen",
      leverancierKleur: leverancier?.kleur ?? "#8a8172",
      regels: regels.sort((a, b) => a.ingredientNaam.localeCompare(b.ingredientNaam)),
      boodschappenlijstId: bestelling?.id ?? null,
      status: (bestelling?.status as BoodschappenStatus | undefined) ?? "open",
    });
  }

  return groepen.sort((a, b) => a.leverancierNaam.localeCompare(b.leverancierNaam));
}
