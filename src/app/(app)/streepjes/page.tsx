import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getActiefKamp } from "@/lib/data/kamp";
import { getStreepjesPersonen, getStreepjesRuw, getStreepjeTypes } from "@/lib/data/streepjes";
import { StreepjesClient } from "@/app/(app)/streepjes/streepjes-client";
import { ShussOproepKnop } from "@/components/shuss-oproep-knop";
import { TrophyIcon } from "@/components/icons";

export default async function StreepjesPage() {
  const kamp = await getActiefKamp();
  if (!kamp) return null; // gated by (app)/layout.tsx, shouldn't happen

  const [personen, types, ruw] = await Promise.all([
    getStreepjesPersonen(kamp.id),
    getStreepjeTypes(kamp.id),
    getStreepjesRuw(kamp.id),
  ]);

  return (
    <>
      <PageHeader title="Streepjes" subtitle="" />
      <StreepjesClient personen={personen} types={types} ruw={ruw} />
      {/* Onderaan i.p.v. in de header — bovenin een hoek raak je op een grote
          telefoon met je duim niet, hier wel. */}
      <div className="fixed right-4 bottom-20 z-30 flex flex-col items-end gap-3 md:right-6 md:bottom-6">
        <ShussOproepKnop />
        <Link
          href="/streepjes/leaderboard"
          aria-label="Leaderboard"
          className="flex size-13 flex-none items-center justify-center rounded-full bg-primary text-white shadow-[0_6px_16px_rgba(0,0,0,0.3)] transition active:scale-90"
        >
          <TrophyIcon width={22} height={22} />
        </Link>
      </div>
    </>
  );
}
