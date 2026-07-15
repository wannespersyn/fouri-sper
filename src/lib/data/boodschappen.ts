import { createClient } from "@/lib/supabase/server";
import { weekdagVan, voegDagenToe } from "@/lib/date";
import type { BestelDag, GerechtBoodschappenRegel, LeverancierBestelling } from "@/lib/boodschappen-shared";
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

// Wat er voor één besteldag nog gehaald moet worden, gegroepeerd per
// leverancier en genest per gerecht (boodschappenlijst_per_gerecht) — zo zie
// je op de kaart meteen wat voor welk gerecht dient en kan je dingen afvinken
// die je al op voorhand gehaald hebt. Enkel ingrediënten met een netto
// behoefte (voorraad al afgetrokken) staan erin, dat rekenwerk gebeurt al in
// de databankfunctie zelf.
export async function getBestelling(kampId: string, dag: string): Promise<LeverancierBestelling[]> {
  const supabase = await createClient();

  const [gerechtBehoefteRes, afgevinktRes, leveranciersRes] = await Promise.all([
    supabase.rpc("boodschappenlijst_per_gerecht", { p_kamp_id: kampId, p_besteldag: dag }),
    supabase
      .from("boodschappen_afgevinkt")
      .select("recept_id, ingredient_id")
      .eq("kamp_id", kampId)
      .eq("besteldag", dag),
    supabase.from("leverancier").select("id, naam, kleur").eq("kamp_id", kampId),
  ]);

  const leveranciersById = new Map((leveranciersRes.data ?? []).map((l) => [l.id, l]));
  const afgevinktSet = new Set((afgevinktRes.data ?? []).map((a) => `${a.recept_id}:${a.ingredient_id}`));

  const gerechtenPerLeverancier = new Map<
    string | null,
    Map<string, { receptNaam: string; regels: GerechtBoodschappenRegel[] }>
  >();
  for (const rij of gerechtBehoefteRes.data ?? []) {
    const regel: GerechtBoodschappenRegel = {
      ingredientId: rij.ingredient_id,
      ingredientNaam: rij.ingredient_naam,
      eenheid: rij.eenheid as Eenheid,
      hoeveelheid: rij.hoeveelheid,
      afgevinkt: afgevinktSet.has(`${rij.recept_id}:${rij.ingredient_id}`),
    };
    const key = (rij.leverancier_id as string | null) ?? null;
    const gerechten = gerechtenPerLeverancier.get(key) ?? new Map();
    const bestaand = gerechten.get(rij.recept_id);
    if (bestaand) bestaand.regels.push(regel);
    else gerechten.set(rij.recept_id, { receptNaam: rij.recept_naam, regels: [regel] });
    gerechtenPerLeverancier.set(key, gerechten);
  }

  const groepen: LeverancierBestelling[] = [];
  for (const [leverancierId, gerechtenMap] of gerechtenPerLeverancier) {
    const leverancier = leverancierId ? leveranciersById.get(leverancierId) : null;
    const gerechten = [...gerechtenMap].map(([receptId, g]) => ({
      receptId,
      receptNaam: g.receptNaam,
      regels: g.regels.sort((a, b) => a.ingredientNaam.localeCompare(b.ingredientNaam)),
    }));
    groepen.push({
      leverancierId,
      leverancierNaam: leverancier?.naam ?? "Geen leverancier toegewezen",
      leverancierKleur: leverancier?.kleur ?? "#8a8172",
      gerechten: gerechten.sort((a, b) => a.receptNaam.localeCompare(b.receptNaam)),
    });
  }

  return groepen.sort((a, b) => a.leverancierNaam.localeCompare(b.leverancierNaam));
}
