import { PageHeader } from "@/components/page-header";
import { getActiefKamp } from "@/lib/data/kamp";
import { getStreepjesPersonen, getStreepjesRuw, getStreepjeTypes } from "@/lib/data/streepjes";
import { getShussGebeurtenissen } from "@/lib/data/shuss";
import { LeaderboardClient } from "@/app/(app)/streepjes/leaderboard/leaderboard-client";

export default async function StreepjesLeaderboardPage() {
  const kamp = await getActiefKamp();
  if (!kamp) return null; // gated by (app)/layout.tsx, shouldn't happen

  const [personen, types, ruw, shussGebeurtenissen] = await Promise.all([
    getStreepjesPersonen(kamp.id),
    getStreepjeTypes(kamp.id),
    getStreepjesRuw(kamp.id),
    getShussGebeurtenissen(kamp.id),
  ]);

  return (
    <>
      <PageHeader title="Leaderboard" subtitle="All-time & per dag klassement" />
      <LeaderboardClient personen={personen} types={types} ruw={ruw} shussGebeurtenissen={shussGebeurtenissen} />
    </>
  );
}
