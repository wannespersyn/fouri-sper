import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getActiefKamp } from "@/lib/data/kamp";
import { getStreepjePersoon, getStreepjesRuw, getStreepjeTypes } from "@/lib/data/streepjes";
import { PersoonDetailClient } from "@/app/(app)/streepjes/[id]/persoon-detail-client";

export default async function StreepjePersoonPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const kamp = await getActiefKamp();
  if (!kamp) return null; // gated by (app)/layout.tsx, shouldn't happen

  const [persoon, types, ruw] = await Promise.all([
    getStreepjePersoon(kamp.id, id),
    getStreepjeTypes(kamp.id),
    getStreepjesRuw(kamp.id),
  ]);

  if (!persoon) {
    return (
      <>
        <PageHeader title="Streepjes" subtitle="" />
        <div className="flex-1 overflow-auto p-3.5 sm:p-5.5">
          <div className="mx-auto max-w-205 rounded-[22px] border border-card-border bg-card p-5 text-sm text-[#6f7d72]">
            Deze persoon is niet gevonden.{" "}
            <Link href="/streepjes" className="font-extrabold text-[#2f6d4f]">
              Terug naar overzicht
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={persoon.naam} subtitle="Profiel & overzicht" />
      <div className="flex-1 overflow-auto p-3.5 sm:p-5.5">
        <PersoonDetailClient persoon={persoon} types={types} ruw={ruw} />
      </div>
    </>
  );
}
