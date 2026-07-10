import { PageHeader } from "@/components/page-header";
import { getActiefKamp } from "@/lib/data/kamp";
import { getIngredientenZonderLeverancier, getLeveranciersMetIngredienten } from "@/lib/data/leveranciers";
import { NieuweLeverancierForm } from "@/app/(app)/leveranciers/nieuwe-leverancier-form";
import { LeverancierCard } from "@/app/(app)/leveranciers/leverancier-card";
import { NietToegewezenIngredienten } from "@/app/(app)/leveranciers/niet-toegewezen-ingredienten";

export default async function LeveranciersPage() {
  const kamp = await getActiefKamp();
  if (!kamp) return null; // gated by (app)/layout.tsx, shouldn't happen

  const [leveranciers, ingredientenZonderLeverancier] = await Promise.all([
    getLeveranciersMetIngredienten(kamp.id),
    getIngredientenZonderLeverancier(kamp.id),
  ]);

  const alleLeveranciers = leveranciers.map((l) => ({ id: l.id, naam: l.naam }));

  return (
    <>
      <PageHeader title="Leveranciers" subtitle="Wie levert welke producten" />
      <div className="flex-1 overflow-auto p-3.5 sm:p-5.5">
        <div className="mx-auto flex max-w-295 flex-col gap-3.5">
          <NieuweLeverancierForm />

          {leveranciers.length === 0 && (
            <p className="text-sm text-[#6f7d72]">
              Nog geen leveranciers — maak er hierboven eentje aan.
            </p>
          )}

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {leveranciers.map((leverancier) => (
              <LeverancierCard
                key={leverancier.id}
                leverancier={leverancier}
                alleLeveranciers={alleLeveranciers}
              />
            ))}
          </div>

          <NietToegewezenIngredienten
            ingredienten={ingredientenZonderLeverancier}
            alleLeveranciers={alleLeveranciers}
          />
        </div>
      </div>
    </>
  );
}
