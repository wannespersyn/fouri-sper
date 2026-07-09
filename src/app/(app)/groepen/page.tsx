import { PageHeader } from "@/components/page-header";
import { getActiefKamp } from "@/lib/data/kamp";
import { getGroepenMetDetails, getDieettypes } from "@/lib/data/groepen";
import { getDagenBereik } from "@/lib/date";
import { GroepCard } from "@/app/(app)/groepen/groep-card";
import { NieuweGroepForm } from "@/app/(app)/groepen/nieuwe-groep-form";

export default async function GroepenPage() {
  const kamp = await getActiefKamp();
  if (!kamp) return null; // gated by (app)/layout.tsx, shouldn't happen

  const [groepen, dieettypes] = await Promise.all([
    getGroepenMetDetails(kamp.id),
    getDieettypes(),
  ]);
  const dagen = getDagenBereik(kamp.start_datum, kamp.eind_datum);

  return (
    <>
      <PageHeader title="Groepen" subtitle="Takken, aanwezigheid & diëten" />
      <div className="flex-1 overflow-auto p-5.5">
        <div className="mx-auto flex max-w-295 flex-col gap-3.5">
          <NieuweGroepForm />

          {groepen.length === 0 && (
            <p className="text-sm text-[#6f7d72]">
              Nog geen groepen — maak er hierboven eentje aan.
            </p>
          )}

          {groepen.map((groep) => (
            <GroepCard key={groep.id} groep={groep} dagen={dagen} dieettypes={dieettypes} />
          ))}
        </div>
      </div>
    </>
  );
}
