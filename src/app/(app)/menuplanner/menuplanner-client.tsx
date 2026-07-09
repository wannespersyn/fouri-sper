"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDagKort, formatDatumLang } from "@/lib/date";
import {
  HOOFDMOMENTEN,
  MAALTIJD_MOMENT_LABEL,
  MOMENT_TIJD,
  capitalize,
  slotDotClass,
  slotStatusClass,
  slotStatusLabel,
} from "@/lib/menuplanner-shared";
import type { DagOverzicht, MaaltijdMoment } from "@/lib/menuplanner-shared";
import type { GroepOptie } from "@/lib/data/groepen";
import type { ReceptOptie } from "@/lib/data/recepten";
import { MaaltijdModal } from "@/app/(app)/menuplanner/maaltijd-modal";

export function MenuplannerClient({
  dagen,
  groepenOpties,
  receptenOpties,
}: Readonly<{
  dagen: DagOverzicht[];
  groepenOpties: GroepOptie[];
  receptenOpties: ReceptOptie[];
}>) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [modalMoment, setModalMoment] = useState<MaaltijdMoment | null>(null);

  const geselecteerdeDag = dagen[selectedIndex] ?? dagen[0];

  const avondSlot = useMemo(
    () => geselecteerdeDag?.slots.find((s) => s.moment === "avond"),
    [geselecteerdeDag]
  );

  if (!geselecteerdeDag) {
    return <p className="text-sm text-[#6f7d72]">Dit kamp heeft geen dagen — controleer de start- en einddatum.</p>;
  }

  return (
    <div className="flex flex-col gap-3.5">
      {/* Weekoverzicht */}
      <div className="rounded-2xl border border-card-border bg-card p-3.5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-bold text-[#25322b]">Weekoverzicht · {dagen.length} dagen</div>
          <div className="flex gap-3.5 text-xs text-[#6f7d72]">
            <span className="flex items-center gap-1.5">
              <span className="size-2.25 rounded-full bg-[#3f8f5f]" />
              <span>Klaar</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.25 rounded-full bg-[#d9862f]" />
              <span>Allergieën</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.25 rounded-full bg-[#cdc4b0]" />
              <span>Leeg</span>
            </span>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {dagen.map((d, i) => {
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
                <span className="mt-0.5 flex gap-0.75">
                  {HOOFDMOMENTEN.map((m) => {
                    const slot = d.slots.find((s) => s.moment === m);
                    return <span key={m} className={`size-1.5 rounded-full ${slot ? slotDotClass(slot.status) : "bg-[#cdc4b0]"}`} />;
                  })}
                </span>
                {d.gesloten && (
                  <span className="text-[9px] font-extrabold" style={{ color: selected ? "#ffd8c9" : "#a83e26" }}>
                    gesloten
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Geselecteerde dag */}
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="font-head text-2xl font-extrabold tracking-tight">
          {capitalize(formatDatumLang(geselecteerdeDag.dag))}
        </h2>
        {geselecteerdeDag.gesloten && (
          <span className="rounded-full bg-[#f7e2dc] px-2.5 py-1 text-xs font-extrabold text-[#a83e26]">
            Winkels gesloten vandaag
          </span>
        )}
        <div className="ml-auto flex items-center gap-2.5 rounded-xl bg-sidebar px-3.5 py-2 text-white">
          <span className="text-[11px] font-semibold tracking-wide text-[#9db6a4] uppercase">Eters vandaag</span>
          <span className="font-head text-lg font-extrabold">{avondSlot?.eters ?? 0}</span>
        </div>
      </div>
      <p className="-mt-2 text-[13px] text-[#6f7d72]">
        {avondSlot?.eters ?? 0} eters bij avondeten · dag {selectedIndex + 1} van {dagen.length}
      </p>

      {/* Maaltijdkaarten */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-2.5">
        {geselecteerdeDag.slots.map((slot) => (
          <div
            key={slot.moment}
            className={`rounded-2xl border bg-card p-3.5 ${
              slot.status === "allergie" ? "border-[#e9c3b6]" : "border-card-border"
            } ${slot.moment === "middernacht_snack" ? "opacity-90" : ""}`}
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="font-head text-base font-extrabold">{MAALTIJD_MOMENT_LABEL[slot.moment]}</span>
              <span className="text-xs font-semibold text-[#8a8172]">{MOMENT_TIJD[slot.moment]}</span>
              <span className={`rounded-full px-2 py-1 text-[11px] font-extrabold ${slotStatusClass(slot.status)}`}>
                {slotStatusLabel(slot.status)}
              </span>
              <span className="ml-auto text-sm font-bold text-[#3d4a42]">{slot.eters} eters</span>
            </div>

            <div className="flex flex-col gap-2">
              {slot.toewijzingen.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl px-2.75 py-2.5"
                  style={{ background: "#f6f2e7", borderLeft: `4px solid ${t.statusOk ? "#3f8f5f" : "#d9862f"}` }}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/recepten/${t.recept_id}`}
                        className="text-sm font-bold text-[#23302a] hover:text-primary"
                      >
                        {t.recept_naam}
                      </Link>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {t.groepen.map((g) => (
                          <span
                            key={g.id}
                            className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                            style={{ background: `${g.kleur}22`, color: g.kleur }}
                          >
                            {g.naam}
                          </span>
                        ))}
                      </div>
                    </div>
                    {!t.statusOk && (
                      <span
                        title={`${t.ontbrekendeDieten.join(", ")} nog niet doorgevoerd`}
                        className="flex-none rounded-full bg-[#f8d6c0] px-1.5 py-0.5 text-[10px] font-bold text-[#cf6f34]"
                      >
                        {t.ontbrekendeDieten.length} dieet{t.ontbrekendeDieten.length > 1 ? "en" : ""} nog in te vullen
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {slot.toewijzingen.length === 0 && (
                <div className="rounded-xl border border-dashed border-card-border p-3 text-center text-[13px] text-[#8a8172]">
                  Nog niets ingepland
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setModalMoment(slot.moment)}
              className="mt-3 w-full rounded-lg border border-card-border bg-white py-2 text-[13px] font-bold text-primary hover:bg-[#eef4ee]"
            >
              Bewerken / toewijzen
            </button>
          </div>
        ))}
      </div>

      {modalMoment && (
        <MaaltijdModal
          dag={geselecteerdeDag.dag}
          moment={modalMoment}
          momentLabel={MAALTIJD_MOMENT_LABEL[modalMoment]}
          toewijzingen={geselecteerdeDag.slots.find((s) => s.moment === modalMoment)?.toewijzingen ?? []}
          groepenOpties={groepenOpties}
          receptenOpties={receptenOpties}
          onClose={() => setModalMoment(null)}
        />
      )}
    </div>
  );
}
