import { PageHeader } from "@/components/page-header";
import { getActiefKamp } from "@/lib/data/kamp";
import { getDagenBereik } from "@/lib/date";
import { getGroepenOpties } from "@/lib/data/groepen";
import { getReceptenOpties } from "@/lib/data/recepten";
import { getMenuplannerOverzicht } from "@/lib/data/menuplanner";
import { MenuplannerClient } from "@/app/(app)/menuplanner/menuplanner-client";

export default async function MenuplannerPage() {
  const kamp = await getActiefKamp();
  if (!kamp) return null; // gated by (app)/layout.tsx, shouldn't happen

  const dagen = getDagenBereik(kamp.start_datum, kamp.eind_datum);
  const [overzicht, groepenOpties, receptenOpties] = await Promise.all([
    getMenuplannerOverzicht(kamp.id, dagen),
    getGroepenOpties(kamp.id),
    getReceptenOpties(kamp.id),
  ]);

  return (
    <>
      <PageHeader title="Menuplanner" subtitle="Weekmenu voor het kamp" />
      <div className="flex-1 overflow-auto p-3.5 sm:p-5.5">
        <div className="mx-auto max-w-295">
          {groepenOpties.length === 0 ? (
            <p className="text-sm text-[#6f7d72]">
              Maak eerst een groep aan bij Groepen — zonder groepen zijn er geen eters om voor te plannen.
            </p>
          ) : (
            <MenuplannerClient dagen={overzicht} groepenOpties={groepenOpties} receptenOpties={receptenOpties} />
          )}
        </div>
      </div>
    </>
  );
}
