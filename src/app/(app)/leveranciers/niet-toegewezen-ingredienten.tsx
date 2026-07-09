import type { IngredientRij as IngredientRijType } from "@/lib/leveranciers-shared";
import { IngredientRij } from "@/app/(app)/leveranciers/ingredient-rij";

export function NietToegewezenIngredienten({
  ingredienten,
  alleLeveranciers,
}: Readonly<{
  ingredienten: IngredientRijType[];
  alleLeveranciers: { id: string; naam: string }[];
}>) {
  if (ingredienten.length === 0) return null;

  return (
    <div className="rounded-[15px] border border-dashed border-card-border bg-card p-4.5">
      <div className="font-head text-[15px] font-extrabold">
        Ingrediënten zonder leverancier ({ingredienten.length})
      </div>
      <p className="mt-1 mb-3 text-[13px] text-[#6f7d72]">
        Aangemaakt via een recept, maar nog aan niemand toegewezen. Klik &quot;Bewerken&quot; om
        een leverancier te kiezen.
      </p>
      <div className="flex flex-col gap-1.5">
        {ingredienten.map((ingredient) => (
          <IngredientRij
            key={ingredient.id}
            ingredient={ingredient}
            leverancierId={null}
            alleLeveranciers={alleLeveranciers}
          />
        ))}
      </div>
    </div>
  );
}
