import { PageHeader } from "@/components/page-header";
import { getActiefKamp } from "@/lib/data/kamp";
import { getGroepenOpties } from "@/lib/data/groepen";
import { getActiviteitenMetDetails } from "@/lib/data/activiteiten";
import { NieuweActiviteitForm } from "@/app/(app)/activiteiten/nieuwe-activiteit-form";
import { ActiviteitCard } from "@/app/(app)/activiteiten/activiteit-card";

export default async function ActiviteitenPage() {
  const kamp = await getActiefKamp();
  if (!kamp) return null; // gated by (app)/layout.tsx, shouldn't happen

  const [groepen, activiteiten] = await Promise.all([
    getGroepenOpties(kamp.id),
    getActiviteitenMetDetails(kamp.id),
  ]);

  return (
    <>
      <PageHeader title="Activiteiten" subtitle="Uitstappen en wie niet mee-eet" />
      <div className="flex-1 overflow-auto p-3.5 sm:p-5.5">
        <div className="mx-auto flex max-w-295 flex-col gap-3.5">
          <NieuweActiviteitForm groepen={groepen} kampStart={kamp.start_datum} kampEind={kamp.eind_datum} />

          {groepen.length === 0 && (
            <p className="text-sm text-[#6f7d72]">
              Maak eerst een groep aan bij Groepen — een activiteit hoort altijd bij een groep.
            </p>
          )}

          {groepen.length > 0 && activiteiten.length === 0 && (
            <p className="text-sm text-[#6f7d72]">
              Nog geen activiteiten — maak er hierboven eentje aan. Elke dag/moment die je aanvinkt
              wordt automatisch als afwezig gezet voor die groep in de menuplanner.
            </p>
          )}

          {activiteiten.map((activiteit) => (
            <ActiviteitCard
              key={activiteit.id}
              activiteit={activiteit}
              groepen={groepen}
              kampStart={kamp.start_datum}
              kampEind={kamp.eind_datum}
            />
          ))}
        </div>
      </div>
    </>
  );
}
