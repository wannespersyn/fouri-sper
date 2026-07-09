"use client";

import { useState } from "react";
import {
  LEVERANCIER_TYPE_OPTIES,
  besteldeadlineLabel,
  typeLabel,
  type Leverancier,
} from "@/lib/leveranciers-shared";
import { updateLeverancier, deleteLeverancier } from "@/app/(app)/leveranciers/actions";
import { IngredientRij } from "@/app/(app)/leveranciers/ingredient-rij";

export function LeverancierCard({
  leverancier,
  alleLeveranciers,
}: Readonly<{
  leverancier: Leverancier;
  alleLeveranciers: { id: string; naam: string }[];
}>) {
  const [bewerken, setBewerken] = useState(false);
  const initiaal = leverancier.naam.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="rounded-[15px] border border-card-border bg-card p-4.5">
      {bewerken ? (
        <form action={updateLeverancier} className="flex flex-wrap items-end gap-2.5">
          <input type="hidden" name="id" value={leverancier.id} />
          <div className="flex flex-col gap-1">
            <label htmlFor={`lev-kleur-${leverancier.id}`} className="text-xs font-bold">
              Kleur
            </label>
            <input
              id={`lev-kleur-${leverancier.id}`}
              name="kleur"
              type="color"
              defaultValue={leverancier.kleur}
              className="h-9 w-12 rounded-lg border border-card-border bg-white p-1"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`lev-naam-${leverancier.id}`} className="text-xs font-bold">
              Naam
            </label>
            <input
              id={`lev-naam-${leverancier.id}`}
              name="naam"
              defaultValue={leverancier.naam}
              required
              className="h-9 rounded-lg border border-card-border bg-white px-2.5 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`lev-type-${leverancier.id}`} className="text-xs font-bold">
              Type
            </label>
            <select
              id={`lev-type-${leverancier.id}`}
              name="type"
              defaultValue={leverancier.type ?? LEVERANCIER_TYPE_OPTIES[0].value}
              className="h-9 rounded-lg border border-card-border bg-white px-2.5 py-1.5 text-sm"
            >
              {LEVERANCIER_TYPE_OPTIES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`lev-contact-${leverancier.id}`} className="text-xs font-bold">
              Contact
            </label>
            <input
              id={`lev-contact-${leverancier.id}`}
              name="contact_info"
              defaultValue={leverancier.contact_info ?? ""}
              className="w-52 rounded-lg border border-card-border bg-white px-2.5 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`lev-deadline-${leverancier.id}`} className="text-xs font-bold">
              Dagen op voorhand
            </label>
            <input
              id={`lev-deadline-${leverancier.id}`}
              name="besteldeadline_dagen"
              type="number"
              min={0}
              defaultValue={leverancier.besteldeadline_dagen}
              className="w-20 rounded-lg border border-card-border bg-white px-2.5 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2.5 w-full">
            <button
              type="submit"
              onClick={() => setBewerken(false)}
              className="h-9 rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-white hover:bg-primary-2"
            >
              Opslaan
            </button>
            <button
              type="button"
              onClick={() => setBewerken(false)}
              className="h-9 rounded-lg px-3 py-1.5 text-sm font-bold text-[#6f7d72] hover:bg-black/5"
            >
              Annuleer
            </button>
            <button
              type="submit"
              formAction={deleteLeverancier}
              className="ml-auto h-9 rounded-lg bg-[#f7e2dc] px-3 py-1.5 text-sm font-bold text-[#a83e26] hover:bg-[#f0d0c6]"
            >
              Leverancier verwijderen
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="flex size-10 flex-none items-center justify-center rounded-[11px] font-head text-[17px] font-extrabold text-white"
            style={{ background: leverancier.kleur }}
          >
            {initiaal}
          </div>
          <div className="min-w-0">
            <div className="font-head text-[17px] font-extrabold">{leverancier.naam}</div>
            <div className="text-xs text-[#6f7d72]">{typeLabel(leverancier.type)}</div>
          </div>
          <button
            onClick={() => setBewerken(true)}
            className="ml-auto rounded-lg px-2.5 py-1 text-xs font-bold text-[#6f7d72] hover:bg-black/5"
          >
            Bewerken
          </button>
        </div>
      )}

      {!bewerken && (
        <>
          {leverancier.contact_info && (
            <p className="mt-3 text-[13px] text-[#6f7d72]">{leverancier.contact_info}</p>
          )}
          <div className="mt-2.5 inline-flex rounded-full bg-[#eef4ee] px-2.5 py-1 text-xs font-bold text-primary">
            {besteldeadlineLabel(leverancier.besteldeadline_dagen)}
          </div>

          <div className="mt-3.5 border-t border-[#eee3ce] pt-3">
            <div className="mb-2 text-xs font-bold tracking-wide text-[#8a8172] uppercase">
              Producten ({leverancier.ingredienten.length})
            </div>
            {leverancier.ingredienten.length === 0 ? (
              <p className="text-sm text-[#8a8172]">
                Nog geen ingrediënten gelinkt. Voeg ze toe via een recept, en wijs ze hier toe
                aan deze leverancier.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {leverancier.ingredienten.map((ingredient) => (
                  <IngredientRij
                    key={ingredient.id}
                    ingredient={ingredient}
                    leverancierId={leverancier.id}
                    alleLeveranciers={alleLeveranciers}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
