import { PageHeader } from "@/components/page-header";
import { getActiefKamp } from "@/lib/data/kamp";
import { getStreepjesPersonen, getStreepjeTellingen, getStreepjeTypes } from "@/lib/data/streepjes";
import { StreepjesClient } from "@/app/(app)/streepjes/streepjes-client";

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
      <PageHeader title="Streepjes" subtitle="" />
      <StreepjesClient personen={personen} types={types} tellingen={tellingen} />
    </>
  );
}
