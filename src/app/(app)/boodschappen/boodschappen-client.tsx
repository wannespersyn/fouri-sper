"use client";

import { useState } from "react";
import { formatDagKort, formatDatumLang } from "@/lib/date";
import { capitalize } from "@/lib/menuplanner-shared";
import type { BestelDag, LeverancierBestelling } from "@/lib/boodschappen-shared";
import { LeverancierBestellingCard } from "@/app/(app)/boodschappen/leverancier-bestelling-card";

export function BoodschappenClient({
  bestelDagen,
  bestellingenPerDag,
}: Readonly<{
  bestelDagen: BestelDag[];
  bestellingenPerDag: Record<string, LeverancierBestelling[]>;
}>) {
  const eersteOpenIndex = Math.max(
    0,
    bestelDagen.findIndex((d) => !d.gesloten)
  );
  const [selectedIndex, setSelectedIndex] = useState(eersteOpenIndex);

  const geselecteerdeDag = bestelDagen[selectedIndex] ?? bestelDagen[0];

  if (!geselecteerdeDag) {
    return (
      <p className="text-sm text-[#6f7d72]">
        Dit kamp heeft geen dagen — controleer de start- en einddatum.
      </p>
    );
  }

  const bestellingen = bestellingenPerDag[geselecteerdeDag.dag] ?? [];

  return (
    <div className="flex flex-col gap-3.5">
      {/* Kampperiode */}
      <div className="rounded-2xl border border-card-border bg-card p-3.5">
        <div className="mb-3 text-sm font-bold text-[#25322b]">
          Kampperiode · {bestelDagen.length} dagen
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {bestelDagen.map((d, i) => {
            const { weekday, dayNum } = formatDagKort(d.dag);
            const selected = i === selectedIndex;
            return (
              <button
                key={d.dag}
                type="button"
                onClick={() => setSelectedIndex(i)}
                className="flex w-15 flex-none flex-col items-center gap-1 rounded-xl border py-2.25"
                style={
                  selected
                    ? { borderColor: "var(--primary)", background: "var(--primary)", color: "#fff" }
                    : { borderColor: "#e4ddcd", background: "#fff", color: "#23302a" }
                }
              >
                <span
                  className="text-[10px] font-extrabold uppercase tracking-wide"
                  style={{ color: d.gesloten ? "#e08a72" : selected ? "#fff" : "#8a8172" }}
                >
                  {weekday}
                </span>
                <span className="font-head text-[17px] font-extrabold leading-none">{dayNum}</span>
                {d.gesloten ? (
                  <span
                    className="text-[9px] font-extrabold"
                    style={{ color: selected ? "#ffd8c9" : "#a83e26" }}
                  >
                    gesloten
                  </span>
                ) : d.bestelVoor2Dagen ? (
                  <span
                    className="text-[9px] font-extrabold"
                    style={{ color: selected ? "#ffe8cf" : "#b85a24" }}
                  >
                    2 dagen
                  </span>
                ) : (
                  <span className="text-[9px] leading-none opacity-0">-</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Geselecteerde dag */}
      <div className="flex flex-wrap items-baseline gap-2.5">
        <h2 className="font-head text-2xl font-extrabold tracking-tight">
          {capitalize(formatDatumLang(geselecteerdeDag.dag))}
        </h2>
        {geselecteerdeDag.gesloten && (
          <span className="rounded-full bg-[#f7e2dc] px-2.5 py-1 text-xs font-extrabold text-[#a83e26]">
            Winkels gesloten
          </span>
        )}
        {geselecteerdeDag.bestelVoor2Dagen && (
          <span className="rounded-full bg-[#fbe7db] px-2.5 py-1 text-xs font-extrabold text-[#b85a24]">
            Bestel voor 2 dagen — dekt tot {capitalize(formatDatumLang(geselecteerdeDag.dektTot))}
          </span>
        )}
      </div>

      {geselecteerdeDag.gesloten ? (
        <p className="rounded-2xl border border-dashed border-card-border bg-card p-4 text-sm text-[#6f7d72]">
          De winkels zijn vandaag dicht — dit is al gedekt door de bestelling van de vorige dag.
        </p>
      ) : bestellingen.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-card-border bg-card p-4 text-sm text-[#6f7d72]">
          Niets te bestellen vandaag — de voorraad dekt alle geplande maaltijden.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {bestellingen.map((b) => (
            <LeverancierBestellingCard
              key={b.leverancierId ?? "geen-leverancier"}
              bestelling={b}
              besteldag={geselecteerdeDag.dag}
            />
          ))}
        </div>
      )}
    </div>
  );
}
