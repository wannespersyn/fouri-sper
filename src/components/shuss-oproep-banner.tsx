"use client";

import { useState } from "react";
import { reageerOpShussOproep } from "@/app/(app)/streepjes/actions";
import { CheckIcon } from "@/components/icons";
import { SHUSS_OPROEP_MAX_JA, type HuidigeShussOproep } from "@/lib/shuss-shared";

export function ShussOproepBanner({ oproep }: Readonly<{ oproep: HuidigeShussOproep }>) {
  const [aantalJa, setAantalJa] = useState(oproep.aantalJa);
  const [eigenReactie, setEigenReactie] = useState(oproep.eigenReactie);
  const [bezig, setBezig] = useState(false);
  const [vol, setVol] = useState(false);

  const kanJaZeggen = eigenReactie === "ja" || aantalJa < SHUSS_OPROEP_MAX_JA;

  async function reageer(reactie: "ja" | "nee") {
    if (bezig || eigenReactie === reactie) return;
    setBezig(true);
    const resultaat = await reageerOpShussOproep(oproep.id, reactie);
    setBezig(false);

    if (!resultaat.ok) {
      setVol(true);
      return;
    }
    setVol(false);
    setAantalJa(resultaat.aantalJa);
    setEigenReactie(reactie);
  }

  return (
    <div className="rounded-2xl border border-card-border bg-card p-4">
      <p className="text-sm font-extrabold">
        {oproep.isEigenOproep ? "Jij" : oproep.afzenderNaam} wil shussen! 🎲
      </p>
      <p className="mt-1 text-xs text-[#8a8172]">
        {aantalJa}/{SHUSS_OPROEP_MAX_JA} zeggen ja{vol && eigenReactie !== "ja" ? " — vol!" : ""}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => reageer("ja")}
          disabled={bezig || !kanJaZeggen}
          className={`flex-1 rounded-xl px-4 py-2 text-sm font-extrabold transition disabled:opacity-40 ${
            eigenReactie === "ja" ? "bg-accent text-white" : "border border-card-border bg-card text-[#4f5b52]"
          }`}
        >
          {eigenReactie === "ja" ? (
            <CheckIcon className="mx-auto" width={18} height={18} />
          ) : (
            "Ja"
          )}
        </button>
        <button
          type="button"
          onClick={() => reageer("nee")}
          disabled={bezig}
          className={`flex-1 rounded-xl px-4 py-2 text-sm font-extrabold transition disabled:opacity-40 ${
            eigenReactie === "nee" ? "bg-[#25322b] text-white" : "border border-card-border bg-card text-[#4f5b52]"
          }`}
        >
          Nee
        </button>
      </div>
    </div>
  );
}
