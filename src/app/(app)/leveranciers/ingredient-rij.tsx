"use client";

import { useState } from "react";
import { EENHEDEN, EENHEID_LABEL } from "@/lib/recepten-shared";
import type { IngredientRij as IngredientRijType } from "@/lib/leveranciers-shared";
import { updateIngredient } from "@/app/(app)/leveranciers/actions";

// Eén ingrediënt-rij, gebruikt zowel binnen een leverancier-kaart (waar
// leverancierId de kaart is waar het ingrediënt nu onder valt) als in de
// "niet toegewezen"-sectie (leverancierId = null). Bewerken past alles in
// één keer aan: naam, eenheid, categorie, verpakkingsgrootte én de
// gekoppelde leverancier.
export function IngredientRij({
  ingredient,
  leverancierId,
  alleLeveranciers,
}: Readonly<{
  ingredient: IngredientRijType;
  leverancierId: string | null;
  alleLeveranciers: { id: string; naam: string }[];
}>) {
  const [bewerken, setBewerken] = useState(false);

  if (!bewerken) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-card-border bg-white px-2.5 py-1.5">
        <span className="text-sm font-semibold">{ingredient.naam}</span>
        <span className="rounded-full bg-[#f0e8dc] px-2 py-0.5 text-[11px] font-bold text-[#a89a80]">
          {EENHEID_LABEL[ingredient.eenheid]}
        </span>
        {ingredient.categorie && (
          <span className="rounded-full bg-[#f0e8dc] px-2 py-0.5 text-[11px] font-bold text-[#a89a80]">
            {ingredient.categorie}
          </span>
        )}
        {ingredient.verpakkingsgrootte != null && (
          <span className="rounded-full bg-[#f0e8dc] px-2 py-0.5 text-[11px] font-bold text-[#a89a80]">
            verpakking: {ingredient.verpakkingsgrootte}
          </span>
        )}
        <button
          onClick={() => setBewerken(true)}
          className="ml-auto rounded-lg px-2.5 py-1 text-xs font-bold text-[#6f7d72] hover:bg-black/5"
        >
          Bewerken
        </button>
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        await updateIngredient(formData);
        setBewerken(false);
      }}
      className="flex flex-wrap items-end gap-2.5 rounded-lg border border-card-border bg-white p-2.5"
    >
      <input type="hidden" name="id" value={ingredient.id} />
      <div className="flex flex-col gap-1">
        <label htmlFor={`ing-naam-${ingredient.id}`} className="text-xs font-bold">
          Naam
        </label>
        <input
          id={`ing-naam-${ingredient.id}`}
          name="naam"
          defaultValue={ingredient.naam}
          required
          className="h-7 rounded-lg border border-card-border px-2.5 py-1.5 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`ing-eenheid-${ingredient.id}`} className="text-xs font-bold">
          Eenheid
        </label>
        <select
          id={`ing-eenheid-${ingredient.id}`}
          name="eenheid"
          defaultValue={ingredient.eenheid}
          className="h-7 rounded-lg border border-card-border px-2.5 py-1.5 text-sm"
        >
          {EENHEDEN.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`ing-categorie-${ingredient.id}`} className="text-xs font-bold">
          Categorie
        </label>
        <input
          id={`ing-categorie-${ingredient.id}`}
          name="categorie"
          defaultValue={ingredient.categorie ?? ""}
          placeholder="bv. groenten"
          className="h-7 w-32 rounded-lg border border-card-border px-2.5 py-1.5 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`ing-verpakking-${ingredient.id}`} className="text-xs font-bold">
          Verpakkingsgrootte
        </label>
        <input
          id={`ing-verpakking-${ingredient.id}`}
          name="verpakkingsgrootte"
          type="number"
          min={0}
          step="any"
          defaultValue={ingredient.verpakkingsgrootte ?? ""}
          placeholder="optioneel"
          className="h-7 w-28 rounded-lg border border-card-border px-2.5 py-1.5 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`ing-leverancier-${ingredient.id}`} className="text-xs font-bold">
          Leverancier
        </label>
        <select
          id={`ing-leverancier-${ingredient.id}`}
          name="leverancier_id"
          defaultValue={leverancierId ?? ""}
          className="h-7 rounded-lg border border-card-border px-2.5 py-1.5 text-sm"
        >
          <option value="">Niet toegewezen</option>
          {alleLeveranciers.map((l) => (
            <option key={l.id} value={l.id}>
              {l.naam}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="h-7 ml-auto rounded-lg bg-primary px-3 py-1 text-sm font-bold text-white hover:bg-primary-2"
      >
        Opslaan
      </button>
      <button
        type="button"
        onClick={() => setBewerken(false)}
        className="h-7 rounded-lg px-3 py-1 text-sm font-bold text-[#6f7d72] hover:bg-black/5"
      >
        Annuleer
      </button>
    </form>
  );
}
