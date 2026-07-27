"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { voegShussPotjeToe, type ShussPotjeSpeler } from "@/app/(app)/streepjes/actions";
import { zoekPersonen, type StreepjePersoon } from "@/lib/streepjes-shared";
import { berekenShussTellingen, type ShussGebeurtenis } from "@/lib/shuss-shared";
import { LedenIcon, PlusIcon } from "@/components/icons";

type Resultaat = "gewonnen" | "verloren";

export function ShussPotjeKnop({
  personen,
  shussGebeurtenissen,
}: Readonly<{ personen: StreepjePersoon[]; shussGebeurtenissen: ShussGebeurtenis[] }>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [resultaten, setResultaten] = useState<Record<string, Resultaat>>({});
  const [bezig, setBezig] = useState(false);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);

  const aantalGekozen = Object.keys(resultaten).length;

  // Meest actieve spelers bovenaan i.p.v. alfabetisch — bij een grote groep
  // scheelt dat scrollen naar de mensen die toch elke keer meedoen.
  function potjesGespeeld(persoonId: string) {
    const tellingen = berekenShussTellingen(shussGebeurtenissen, persoonId);
    return tellingen.gewonnen + tellingen.verloren;
  }
  const gefilterd = query.trim()
    ? zoekPersonen(personen, query)
    : [...personen].sort((a, b) => potjesGespeeld(b.id) - potjesGespeeld(a.id) || a.naam.localeCompare(b.naam));

  useEffect(() => {
    if (!open) return;
    const vorige = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = vorige;
    };
  }, [open]);

  function kiesResultaat(persoonId: string, resultaat: Resultaat) {
    setResultaten((huidig) => {
      const kopie = { ...huidig };
      if (kopie[persoonId] === resultaat) delete kopie[persoonId];
      else kopie[persoonId] = resultaat;
      return kopie;
    });
  }

  function sluit() {
    setOpen(false);
    setQuery("");
    setResultaten({});
    setFoutmelding(null);
  }

  async function opslaan() {
    const spelers: ShussPotjeSpeler[] = Object.entries(resultaten).map(([streepjePersoonId, resultaat]) => ({
      streepjePersoonId,
      resultaat,
    }));
    if (spelers.length === 0) return;

    setBezig(true);
    setFoutmelding(null);
    const resultaat = await voegShussPotjeToe(spelers);
    setBezig(false);
    if (!resultaat.ok) setFoutmelding(resultaat.error);
    else sluit();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Nieuw shuss-potje toevoegen"
        className="flex size-13 flex-none items-center justify-center rounded-full bg-primary text-white shadow-[0_6px_16px_rgba(0,0,0,0.3)] transition active:scale-90"
      >
        <PlusIcon width={24} height={24} />
      </button>

      {open && (
        <div className="fixed inset-0 z-150 flex items-end justify-center bg-black/60 sm:items-center sm:p-4">
          <div className="flex max-h-[85vh] w-full flex-col rounded-t-[22px] border border-card-border bg-card p-5 sm:max-w-105 sm:rounded-[22px]">
            <div className="flex flex-none items-center justify-between">
              <h2 className="text-base font-extrabold">Nieuw shuss-potje</h2>
              <button
                type="button"
                onClick={sluit}
                aria-label="Sluiten"
                className="flex size-8 flex-none items-center justify-center rounded-lg bg-black/5 text-lg hover:bg-black/10"
              >
                ×
              </button>
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek een naam…"
              className="mt-3 flex-none rounded-xl border border-card-border bg-card px-3.5 py-2 text-sm outline-none focus:border-primary"
            />

            <div className="mt-3 flex-1 overflow-auto">
              {gefilterd.length === 0 ? (
                <p className="mt-6 text-center text-sm text-[#6f7d72]">Niemand gevonden.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {gefilterd.map((p) => {
                    const resultaat = resultaten[p.id];
                    return (
                      <div key={p.id} className="flex items-center gap-2.5 rounded-xl border border-card-border p-2">
                        {p.fotoUrl ? (
                          <Image
                            src={p.fotoUrl}
                            alt=""
                            width={28}
                            height={28}
                            className="size-7 flex-none rounded-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="flex size-7 flex-none items-center justify-center rounded-full bg-[#f0ede2] text-[#8a8172]">
                            <LedenIcon width={13} height={13} />
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate text-sm font-bold">{p.naam}</span>
                        <button
                          type="button"
                          onClick={() => kiesResultaat(p.id, "gewonnen")}
                          aria-label={`${p.naam} won`}
                          className={`flex size-8 flex-none items-center justify-center rounded-full text-xs font-extrabold transition active:scale-90 ${
                            resultaat === "gewonnen"
                              ? "bg-[#dcf3e6] text-[#1f6b43]"
                              : "border border-card-border text-[#4f5b52]"
                          }`}
                        >
                          W
                        </button>
                        <button
                          type="button"
                          onClick={() => kiesResultaat(p.id, "verloren")}
                          aria-label={`${p.naam} verloor`}
                          className={`flex size-8 flex-none items-center justify-center rounded-full text-xs font-extrabold transition active:scale-90 ${
                            resultaat === "verloren"
                              ? "bg-[#fee2e2] text-[#b91c1c]"
                              : "border border-card-border text-[#4f5b52]"
                          }`}
                        >
                          V
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {foutmelding && (
              <p className="mt-2 flex-none rounded-xl bg-[#f7e2dc] px-3.5 py-2 text-xs font-semibold text-[#a83e26]">
                {foutmelding}
              </p>
            )}

            <button
              type="button"
              onClick={opslaan}
              disabled={aantalGekozen === 0 || bezig}
              className="mt-3 flex-none rounded-xl bg-primary px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-40"
            >
              {aantalGekozen > 0 ? `Opslaan (${aantalGekozen})` : "Opslaan"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
