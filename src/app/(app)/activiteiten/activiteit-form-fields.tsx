"use client";

import { useState } from "react";
import { getDagenBereik, formatDagKort } from "@/lib/date";
import { MAALTIJD_MOMENTEN, type DagMomenten, type MaaltijdMoment } from "@/lib/activiteiten-shared";

export type GroepOptie = { id: string; naam: string; kleur: string };

// Shared field set for both the "nieuwe activiteit" shell and the
// edit-in-place form on an existing kaart — keeps the two forms identical
// without hand-syncing them. Client Component because the "eet niet mee
// tijdens" grid reacts live to the chosen van/tot range.
export function ActiviteitFormFields({
  idPrefix,
  groepen,
  kampStart,
  kampEind,
  defaultGroepId,
  defaultNaam,
  defaultVanDatum,
  defaultTotDatum,
  defaultKleur,
  defaultMomentenPerDag,
}: Readonly<{
  idPrefix: string;
  groepen: GroepOptie[];
  kampStart: string;
  kampEind: string;
  defaultGroepId?: string;
  defaultNaam?: string;
  defaultVanDatum?: string;
  defaultTotDatum?: string;
  defaultKleur?: string;
  defaultMomentenPerDag?: DagMomenten[];
}>) {
  const [vanDatum, setVanDatum] = useState(defaultVanDatum ?? kampStart);
  const [totDatum, setTotDatum] = useState(defaultTotDatum ?? kampStart);
  const [perDag, setPerDag] = useState<Map<string, Set<MaaltijdMoment>>>(
    () => new Map((defaultMomentenPerDag ?? []).map((d) => [d.dag, new Set(d.momenten)]))
  );

  const dagen = totDatum >= vanDatum ? getDagenBereik(vanDatum, totDatum) : [];

  function isChecked(dag: string, moment: MaaltijdMoment) {
    return perDag.get(dag)?.has(moment) ?? false;
  }

  function toggelDagMoment(dag: string, moment: MaaltijdMoment) {
    setPerDag((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(dag));
      if (set.has(moment)) {
        set.delete(moment);
      } else {
        set.add(moment);
      }
      next.set(dag, set);
      return next;
    });
  }

  function toggelKolom(moment: MaaltijdMoment) {
    const staatOveralAan = dagen.every((dag) => isChecked(dag, moment));
    setPerDag((prev) => {
      const next = new Map(prev);
      for (const dag of dagen) {
        const set = new Set(next.get(dag));
        if (staatOveralAan) {
          set.delete(moment);
        } else {
          set.add(moment);
        }
        next.set(dag, set);
      }
      return next;
    });
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-kleur`} className="text-xs font-bold">
          Kleur
        </label>
        <input
          id={`${idPrefix}-kleur`}
          name="kleur"
          type="color"
          defaultValue={defaultKleur ?? "#8a5ab0"}
          className="h-9 w-12 rounded-lg border border-card-border bg-white p-1"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-naam`} className="text-xs font-bold">
          Naam
        </label>
        <input
          id={`${idPrefix}-naam`}
          name="naam"
          required
          defaultValue={defaultNaam}
          placeholder="bv. Givers 3-daagse"
          className="h-9 rounded-lg border border-card-border bg-white px-2.5 py-1.5 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-groep`} className="text-xs font-bold">
          Groep
        </label>
        <select
          id={`${idPrefix}-groep`}
          name="groep_id"
          required
          defaultValue={defaultGroepId}
          className="h-9 rounded-lg border border-card-border bg-white px-2.5 py-1.5 text-sm"
        >
          <option value="" disabled>
            Kies een groep…
          </option>
          {groepen.map((g) => (
            <option key={g.id} value={g.id}>
              {g.naam}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-van`} className="text-xs font-bold">
          Van
        </label>
        <input
          id={`${idPrefix}-van`}
          name="van_datum"
          type="date"
          required
          min={kampStart}
          max={kampEind}
          value={vanDatum}
          onChange={(e) => setVanDatum(e.target.value)}
          className="h-9 rounded-lg border border-card-border bg-white px-2.5 py-1.5 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-tot`} className="text-xs font-bold">
          Tot
        </label>
        <input
          id={`${idPrefix}-tot`}
          name="tot_datum"
          type="date"
          required
          min={kampStart}
          max={kampEind}
          value={totDatum}
          onChange={(e) => setTotDatum(e.target.value)}
          className="h-9 rounded-lg border border-card-border bg-white px-2.5 py-1.5 text-sm"
        />
      </div>
      <fieldset className="flex flex-col gap-1 basis-full">
        <legend className="text-xs font-bold">Eet niet mee tijdens</legend>
        {dagen.length === 0 ? (
          <p className="py-1 text-xs text-[#6f7d72]">Kies eerst een geldige periode.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-card-border">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-black/3">
                  <th className="w-16" />
                  {MAALTIJD_MOMENTEN.map((m) => (
                    <th key={m.value} className="border-l border-card-border px-2 py-2 font-semibold">
                      <label className="flex cursor-pointer flex-col items-center gap-1">
                        <input
                          type="checkbox"
                          checked={dagen.every((dag) => isChecked(dag, m.value))}
                          onChange={() => toggelKolom(m.value)}
                        />
                        <span>{m.label}</span>
                      </label>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dagen.map((dag, i) => {
                  const { weekday, dayNum } = formatDagKort(dag);
                  return (
                    <tr key={dag} className={i > 0 ? "border-t border-card-border" : undefined}>
                      <td className="px-3 py-1.5 font-semibold whitespace-nowrap text-[#3d4a42]">
                        {weekday} {dayNum}
                      </td>
                      {MAALTIJD_MOMENTEN.map((m) => (
                        <td key={m.value} className="border-l border-card-border px-2 py-1.5 text-center">
                          <input
                            type="checkbox"
                            name="dagmoment"
                            value={`${dag}|${m.value}`}
                            checked={isChecked(dag, m.value)}
                            onChange={() => toggelDagMoment(dag, m.value)}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </fieldset>
    </>
  );
}
