import { PageHeader } from "@/components/page-header";
import { getActiefKamp } from "@/lib/data/kamp";
import { getReceptenOverzicht } from "@/lib/data/recepten";
import { NieuwReceptForm } from "@/app/(app)/recepten/nieuw-recept-form";
import { ReceptenOverzichtClient } from "@/app/(app)/recepten/recepten-overzicht-client";

export default async function ReceptenPage() {
  const kamp = await getActiefKamp();
  if (!kamp) return null; // gated by (app)/layout.tsx, shouldn't happen

  const recepten = await getReceptenOverzicht(kamp.id);

  return (
    <>
      <PageHeader title="Recepten" subtitle="Alle gerechten en hun status" right={<NieuwReceptForm />} />
      <div className="flex-1 overflow-auto p-5.5">
        <div className="mx-auto max-w-310">
          {recepten.length === 0 ? (
            <p className="text-sm text-[#6f7d72]">Nog geen recepten — maak er hierboven eentje aan.</p>
          ) : (
            <ReceptenOverzichtClient recepten={recepten} />
          )}
        </div>
      </div>
    </>
  );
}
