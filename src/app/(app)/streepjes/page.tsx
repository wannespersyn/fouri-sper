import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getActiefKamp } from "@/lib/data/kamp";
import { getStreepjesPersonen, getStreepjeTellingen, getStreepjeTypes } from "@/lib/data/streepjes";
import { StreepjesClient } from "@/app/(app)/streepjes/streepjes-client";
import { TrophyIcon } from "@/components/icons";

export default async function StreepjesPage() {
  const kamp = await getActiefKamp();
  if (!kamp) return null; // gated by (app)/layout.tsx, shouldn't happen

  const [personen, types, tellingen] = await Promise.all([
    getStreepjesPersonen(kamp.id),
    getStreepjeTypes(kamp.id),
    getStreepjeTellingen(kamp.id),
  ]);

  return (
    <>
      <PageHeader
        title="Streepjes"
        subtitle=""
        right={
          <Link
            href="/streepjes/leaderboard"
            aria-label="Leaderboard"
            className="flex size-11 flex-none items-center justify-center rounded-xl bg-primary text-white transition active:scale-90"
          >
            <TrophyIcon width={20} height={20} />
          </Link>
        }
      />
      <StreepjesClient personen={personen} types={types} tellingen={tellingen} />
    </>
  );
}
