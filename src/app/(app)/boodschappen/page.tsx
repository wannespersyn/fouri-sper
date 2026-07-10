import { PageHeader } from "@/components/page-header";
import { getActiefKamp } from "@/lib/data/kamp";
import { getDagenBereik } from "@/lib/date";
import { getBestelDagen, getBestelling } from "@/lib/data/boodschappen";
import { BoodschappenClient } from "@/app/(app)/boodschappen/boodschappen-client";

export default async function BoodschappenPage() {
  const kamp = await getActiefKamp();
  if (!kamp) return null; // gated by (app)/layout.tsx, shouldn't happen

  const dagen = getDagenBereik(kamp.start_datum, kamp.eind_datum);
  const bestelDagen = await getBestelDagen(kamp.id, dagen);

  // Enkel dagen waarop de winkel effectief open is hebben een eigen
  // bestellijst nodig — een gesloten dag wordt al gedekt door de bestelling
  // van de vorige (open) dag.
  const bestellingenPerDag = Object.fromEntries(
    await Promise.all(
      bestelDagen
        .filter((d) => !d.gesloten)
        .map(async (d) => [d.dag, await getBestelling(kamp.id, d.dag)] as const)
    )
  );

  return (
    <>
      <PageHeader title="Boodschappen" subtitle="Dagelijks besteloverzicht" />
      <div className="flex-1 overflow-auto p-3.5 sm:p-5.5">
        <div className="mx-auto max-w-295">
          <BoodschappenClient bestelDagen={bestelDagen} bestellingenPerDag={bestellingenPerDag} />
        </div>
      </div>
    </>
  );
}
