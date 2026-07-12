"use client";

import { useState } from "react";
import { formatDagKort } from "@/lib/date";
import type { Dieettype, Groep, Persoon } from "@/lib/data/groepen";
import {
  updateGroep,
  deleteGroep,
  addPersoon,
  updatePersoon,
  removePersoon,
  toggleDagAanwezigheid,
  cyclePersoonDagAanwezigheid,
} from "@/app/(app)/groepen/actions";

const GROEP_TYPES = [
  { value: "tak", label: "Tak" },
  { value: "leiding", label: "Leiding" },
  { value: "fouri", label: "Fouri" },
  { value: "externen", label: "Externen" },
];

export function GroepCard({
  groep,
  dagen,
  dieettypes,
}: Readonly<{
  groep: Groep;
  dagen: string[];
  dieettypes: Dieettype[];
}>) {
  const [bewerken, setBewerken] = useState(false);
  const [persoonForm, setPersoonForm] = useState(false);
  const [personenOpen, setPersonenOpen] = useState(false);
  const [zoekterm, setZoekterm] = useState("");
  const [expandedPersoonId, setExpandedPersoonId] = useState<string | null>(null);

  const gefilterdePersonen = zoekterm.trim()
    ? groep.personen.filter((p) =>
        p.naam.toLowerCase().includes(zoekterm.trim().toLowerCase())
      )
    : groep.personen;

  const dietCounts = dieettypes
    .map((d) => ({
      dieettype: d,
      aantal: groep.personen.filter((p) => p.dieettypeIds.includes(d.id)).length,
    }))
    .filter((d) => d.aantal > 0);

  return (
    <div className="rounded-[15px] border border-card-border bg-card p-4.5">
      {bewerken ? (
        <form
          action={async (formData) => {
            await updateGroep(formData);
            setBewerken(false);
          }}
          className="flex flex-wrap items-end gap-2.5"
        >
          <input type="hidden" name="id" value={groep.id} />
          <div className="flex flex-col gap-1">
            <label htmlFor={`groep-kleur-${groep.id}`} className="text-xs font-bold">
              Kleur
            </label>
            <input
              id={`groep-kleur-${groep.id}`}
              name="kleur"
              type="color"
              defaultValue={groep.kleur}
              className="h-9 w-12 rounded-lg border border-card-border bg-white p-1"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`groep-naam-${groep.id}`} className="text-xs font-bold">
              Naam
            </label>
            <input
              id={`groep-naam-${groep.id}`}
              name="naam"
              defaultValue={groep.naam}
              required
              className="h-9 rounded-lg border border-card-border bg-white px-2.5 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`groep-type-${groep.id}`} className="text-xs font-bold">
              Type
            </label>
            <select
              id={`groep-type-${groep.id}`}
              name="type"
              defaultValue={groep.type}
              className="h-9 rounded-lg border border-card-border bg-white px-2.5 py-1.5 text-sm"
            >
              {GROEP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`groep-aantal-${groep.id}`} className="text-xs font-bold">
              Aantal
            </label>
            <input
              id={`groep-aantal-${groep.id}`}
              name="basis_aantal"
              type="number"
              min={0}
              defaultValue={groep.basis_aantal}
              className="h-9 w-20 rounded-lg border border-card-border bg-white px-2.5 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="h-9 rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-white hover:bg-primary-2"
          >
            Opslaan
          </button>
          <button
            type="submit"
            formAction={deleteGroep}
            className="h-9 rounded-lg bg-[#f7e2dc] px-3 py-1.5 text-sm font-bold text-[#a83e26] hover:bg-[#f0d0c6]"
          >
            Groep verwijderen
          </button>
          <button
            type="button"
            onClick={() => setBewerken(false)}
            className="h-9 ml-auto rounded-lg px-3 py-1.5 text-sm font-bold text-[#6f7d72] hover:bg-black/5"
          >
            Annuleer
          </button>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="size-3.5 rounded" style={{ background: groep.kleur }} />
          <div className="font-head text-[19px] font-extrabold">{groep.naam}</div>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {dietCounts.map(({ dieettype, aantal }) => (
              <span
                key={dieettype.id}
                className="rounded-full px-2 py-0.5 text-xs font-bold"
                style={{ background: dieettype.kleur + "22", color: dieettype.kleur }}
              >
                {aantal}× {dieettype.naam.toLowerCase()}
              </span>
            ))}
            <button
              onClick={() => setBewerken(true)}
              className="rounded-lg px-2.5 py-1 text-xs font-bold text-[#6f7d72] hover:bg-black/5"
            >
              Bewerken
            </button>
          </div>
        </div>
      )}

      <div className="mt-3.5">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {dagen.map((dag) => {
            const afwezig = groep.afwezigeDagen.has(dag);
            const { weekday, dayNum } = formatDagKort(dag);
            return (
              <form key={dag} action={toggleDagAanwezigheid}>
                <input type="hidden" name="groep_id" value={groep.id} />
                <input type="hidden" name="dag" value={dag} />
                <button
                  type="submit"
                  title={`${groep.naam} ${afwezig ? "afwezig" : "aanwezig"} op ${dag}`}
                  className="flex w-10.5 flex-none flex-col items-center rounded-lg border px-0.5 py-1.5"
                  style={
                    afwezig
                      ? { borderColor: "#e4ddcd", background: "#f2ede0", color: "#bcb3a0" }
                      : { borderColor: groep.kleur, background: groep.kleur + "1f", color: "#23302a" }
                  }
                >
                  <span className="text-[9px] font-bold opacity-70">{weekday}</span>
                  <span className="font-head text-sm font-extrabold">{dayNum}</span>
                </button>
              </form>
            );
          })}
        </div>
      </div>

      <div className="mt-3.5 border-t border-[#eee3ce] pt-3">
        <div className="mb-2 flex items-center gap-2">
          <button
            onClick={() => setPersonenOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-[#8a8172] uppercase hover:text-[#6f7d72]"
          >
            <span className={`transition-transform ${personenOpen ? "rotate-90" : ""}`}>
              ›
            </span>
            Personen ({groep.personen.length})
          </button>
          <button
            onClick={() => {
              setPersoonForm((v) => !v);
              setPersonenOpen(true);
            }}
            className="ml-auto rounded-full bg-[#eef4ee] px-2.75 py-1 text-xs font-bold text-primary hover:bg-primary/15"
          >
            + Persoon
          </button>
        </div>

        {persoonForm && (
          <form
            action={async (formData) => {
              await addPersoon(formData);
              setPersoonForm(false);
            }}
            className="mb-2.5 flex flex-wrap items-end gap-2.5 rounded-lg border border-card-border bg-white p-2.5"
          >
            <input type="hidden" name="groep_id" value={groep.id} />
            <div className="flex flex-col gap-1">
              <label htmlFor={`nieuw-persoon-naam-${groep.id}`} className="text-xs font-bold">
                Naam
              </label>
              <input
                id={`nieuw-persoon-naam-${groep.id}`}
                name="naam"
                required
                className="rounded-lg border border-card-border px-2.5 py-1.5 text-sm"
              />
            </div>
            <fieldset className="flex flex-col gap-1">
              <legend className="text-xs font-bold">Dieet</legend>
              <div className="flex flex-wrap gap-2 py-1.5">
                {dieettypes.map((d) => (
                  <label key={d.id} className="flex items-center gap-1 text-xs font-semibold">
                    <input type="checkbox" name="dieettype_id" value={d.id} />
                    {d.naam}
                  </label>
                ))}
              </div>
            </fieldset>
            <button
              type="submit"
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-white hover:bg-primary-2"
            >
              Toevoegen
            </button>
          </form>
        )}

        {personenOpen && (
          <>
            {groep.personen.length > 8 && (
              <input
                type="text"
                value={zoekterm}
                onChange={(e) => setZoekterm(e.target.value)}
                placeholder={`Zoek in ${groep.personen.length} personen…`}
                className="mb-2 w-full rounded-lg bg-white border border-card-border px-2.5 py-1.5 text-sm"
              />
            )}

            <div className="flex max-h-96 flex-col gap-1.5 overflow-y-auto pr-0.5">
              {gefilterdePersonen.map((p) => (
                <PersoonRow
                  key={p.id}
                  persoon={p}
                  groep={groep}
                  dagen={dagen}
                  dieettypes={dieettypes}
                  expanded={expandedPersoonId === p.id}
                  onToggleExpand={() =>
                    setExpandedPersoonId((cur) => (cur === p.id ? null : p.id))
                  }
                />
              ))}
              {groep.personen.length === 0 && (
                <p className="text-sm text-[#8a8172]">
                  Nog niemand met een specifiek dieet toegevoegd.
                </p>
              )}
              {groep.personen.length > 0 && gefilterdePersonen.length === 0 && (
                <p className="text-sm text-[#8a8172]">Niemand gevonden voor &quot;{zoekterm}&quot;.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PersoonRow({
  persoon,
  groep,
  dagen,
  dieettypes,
  expanded,
  onToggleExpand,
}: Readonly<{
  persoon: Persoon;
  groep: Groep;
  dagen: string[];
  dieettypes: Dieettype[];
  expanded: boolean;
  onToggleExpand: () => void;
}>) {
  const aantalAfwijkingen = persoon.afwijkingen.size;

  return (
    <div className="rounded-lg border border-card-border bg-white">
      <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-1.5">
        <button
          onClick={onToggleExpand}
          className="flex items-center gap-1.5 text-left text-sm font-semibold"
        >
          {persoon.naam}
        </button>
        {persoon.dieettypeIds.map((id) => {
          const d = dieettypes.find((x) => x.id === id);
          if (!d) return null;
          return (
            <span
              key={id}
              className="rounded-full px-1.5 py-0.5 text-[11px] font-bold"
              style={{ background: d.kleur + "22", color: d.kleur }}
            >
              {d.naam}
            </span>
          );
        })}
        {aantalAfwijkingen > 0 && (
          <span className="rounded-full bg-[#fbe7db] px-1.5 py-0.5 text-[11px] font-bold text-[#b85a24]">
            {aantalAfwijkingen} afwijkende dag{aantalAfwijkingen > 1 ? "en" : ""}
          </span>
        )}
        {persoon.allergieOpmerking && (
          <span
            title={persoon.allergieOpmerking}
            className="flex size-4.5 items-center justify-center rounded-full bg-[#f8d6c0] text-[10px] font-bold text-[#cf6f34]"
          >
            !
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={onToggleExpand}
            className="rounded-lg px-2 py-1 text-xs font-bold text-[#6f7d72] hover:bg-black/5"
          >
            {expanded ? "Sluiten" : "Bewerken"}
          </button>
          <form action={removePersoon}>
            <input type="hidden" name="id" value={persoon.id} />
            <button
              type="submit"
              title="Verwijderen"
              className="rounded-lg px-2 py-1 text-xs font-bold text-[#a89a80] hover:bg-black/5 hover:text-[#a83e26]"
            >
              ×
            </button>
          </form>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-card-border p-2.5">
          <form action={updatePersoon} className="mb-3 flex flex-wrap items-end gap-2.5">
            <input type="hidden" name="id" value={persoon.id} />
            <div className="flex flex-col gap-1">
              <label htmlFor={`persoon-naam-${persoon.id}`} className="text-xs font-bold">
                Naam
              </label>
              <input
                id={`persoon-naam-${persoon.id}`}
                name="naam"
                defaultValue={persoon.naam}
                required
                className="rounded-lg border border-card-border px-2.5 py-1.5 text-sm"
              />
            </div>
            <fieldset className="flex flex-col gap-1">
              <legend className="text-xs font-bold">Dieet</legend>
              <div className="flex flex-wrap gap-2 py-1.5">
                {dieettypes.map((d) => (
                  <label key={d.id} className="flex items-center gap-1 text-xs font-semibold">
                    <input
                      type="checkbox"
                      name="dieettype_id"
                      value={d.id}
                      defaultChecked={persoon.dieettypeIds.includes(d.id)}
                    />
                    {d.naam}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex w-full flex-col gap-1">
              <label htmlFor={`persoon-allergie-${persoon.id}`} className="text-xs font-bold">
                Bijzondere allergieën / opmerkingen
              </label>
              <textarea
                id={`persoon-allergie-${persoon.id}`}
                name="allergie_opmerking"
                defaultValue={persoon.allergieOpmerking ?? ""}
                rows={2}
                placeholder="bv. geen kiwi, lichte lactose-intolerantie behalve kaas…"
                className="w-full rounded-lg border border-card-border px-2.5 py-1.5 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-white hover:bg-primary-2"
            >
              Opslaan
            </button>
          </form>

          <div className="text-xs font-bold tracking-wide text-[#8a8172] uppercase">
            Aanwezigheid afwijkend van de groep
          </div>
          <p className="mt-0.5 mb-1.5 text-xs text-[#8a8172]">
            Standaard volgt {persoon.naam.split(" ")[0]} de groep. Klik een dag aan om af te
            wijken — nogmaals klikken wisselt aanwezig/afwezig, een derde keer zet het terug op
            &quot;volgt groep&quot;.
          </p>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {dagen.map((dag) => {
              const override = persoon.afwijkingen.get(dag);
              const groepAanwezig = !groep.afwezigeDagen.has(dag);
              const { weekday, dayNum } = formatDagKort(dag);

              let style: React.CSSProperties;
              if (override === true) {
                style = { borderColor: "var(--primary)", background: "var(--primary)", color: "#fff" };
              } else if (override === false) {
                style = { borderColor: "#e9c3b6", background: "#f7e2dc", color: "#a83e26" };
              } else {
                style = groepAanwezig
                  ? { borderColor: "#d7e4da", background: "#fff", color: "#23302a" }
                  : { borderColor: "#e4ddcd", background: "#fff", color: "#bcb3a0" };
              }

              return (
                <form key={dag} action={cyclePersoonDagAanwezigheid}>
                  <input type="hidden" name="persoon_id" value={persoon.id} />
                  <input type="hidden" name="dag" value={dag} />
                  <button
                    type="submit"
                    title={
                      override === undefined
                        ? `Volgt groep (${groepAanwezig ? "aanwezig" : "afwezig"}) op ${dag}`
                        : `${persoon.naam} expliciet ${override ? "aanwezig" : "afwezig"} op ${dag}`
                    }
                    className="flex w-10.5 flex-none flex-col items-center rounded-lg border px-0.5 py-1.5"
                    style={style}
                  >
                    <span className="text-[9px] font-bold opacity-70">{weekday}</span>
                    <span className="font-head text-sm font-extrabold">{dayNum}</span>
                  </button>
                </form>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
