"use client";

import { useState } from "react";
import { assignRecept, removeToewijzing } from "@/app/(app)/menuplanner/actions";
import { formatDatumLang } from "@/lib/date";
import { capitalize } from "@/lib/menuplanner-shared";
import { categorieLabel } from "@/lib/recepten-shared";
import type { MaaltijdMoment, MaaltijdToewijzing } from "@/lib/menuplanner-shared";
import type { GroepOptie } from "@/lib/data/groepen";
import type { ReceptOptie } from "@/lib/data/recepten";

export function MaaltijdModal({
  dag,
  moment,
  momentLabel,
  toewijzingen,
  groepenOpties,
  receptenOpties,
  onClose,
}: Readonly<{
  dag: string;
  moment: MaaltijdMoment;
  momentLabel: string;
  toewijzingen: MaaltijdToewijzing[];
  groepenOpties: GroepOptie[];
  receptenOpties: ReceptOptie[];
  onClose: () => void;
}>) {
  const [receptId, setReceptId] = useState("");
  const [groepIds, setGroepIds] = useState<string[]>([]);
  const [fout, setFout] = useState<string | null>(null);

  function toggleGroep(id: string) {
    setGroepIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#141e18]/50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] w-full max-w-130 overflow-auto rounded-[18px] bg-card p-5.5"
      >
        <div className="flex items-center gap-2.5">
          <h3 className="font-head text-xl font-extrabold tracking-tight">{momentLabel} bewerken</h3>
          <button
            onClick={onClose}
            className="ml-auto flex size-8 flex-none items-center justify-center rounded-lg bg-black/5 text-lg hover:bg-black/10"
          >
            ×
          </button>
        </div>
        <p className="mt-1 text-[13px] text-[#6f7d72]">
          {capitalize(formatDatumLang(dag))} · wijs gerechten toe aan groepen
        </p>

        <div className="mt-4 text-xs font-bold tracking-wide text-[#8a8172] uppercase">Toegewezen gerechten</div>
        <div className="mt-2 flex flex-col gap-2">
          {toewijzingen.map((t) => (
            <div key={t.id} className="flex items-center gap-2.5 rounded-xl border border-card-border bg-white p-2.75">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-[#25322b]">{t.recept_naam}</div>
                <div className="mt-0.5 text-xs text-[#6f7d72]">
                  {t.groepen.length > 0 ? t.groepen.map((g) => g.naam).join(", ") : "geen groepen"} · {t.eters} eters
                </div>
              </div>
              <form action={removeToewijzing}>
                <input type="hidden" name="id" value={t.id} />
                <button
                  type="submit"
                  title="Verwijderen"
                  className="flex size-7.5 flex-none items-center justify-center rounded-lg bg-[#f7e2dc] text-sm font-bold text-[#a83e26] hover:bg-[#f0d0c6]"
                >
                  ×
                </button>
              </form>
            </div>
          ))}
          {toewijzingen.length === 0 && (
            <p className="rounded-xl border border-dashed border-card-border p-3 text-sm text-[#8a8172]">
              Nog geen gerecht toegewezen.
            </p>
          )}
        </div>

        <div className="mt-4 border-t border-[#eee3ce] pt-4">
          <div className="text-xs font-bold tracking-wide text-[#8a8172] uppercase">Gerecht toevoegen</div>

          <form
            action={async (formData) => {
              if (!receptId || groepIds.length === 0) {
                setFout("Kies een recept én minstens één groep.");
                return;
              }
              setFout(null);
              await assignRecept(formData);
              setReceptId("");
              setGroepIds([]);
            }}
            className="mt-2 flex flex-col gap-2.5"
          >
            <input type="hidden" name="dag" value={dag} />
            <input type="hidden" name="moment" value={moment} />
            {groepIds.map((id) => (
              <input key={id} type="hidden" name="groep_id" value={id} />
            ))}

            <select
              name="recept_id"
              value={receptId}
              onChange={(e) => setReceptId(e.target.value)}
              className="rounded-lg border border-card-border bg-white px-2.5 py-2 text-sm"
            >
              <option value="">Kies een recept…</option>
              {receptenOpties.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.naam} ({categorieLabel(r.categorie)})
                </option>
              ))}
            </select>
            {receptenOpties.length === 0 && (
              <p className="text-xs text-[#8a8172]">Nog geen recepten — maak er eerst eentje aan bij Recepten.</p>
            )}

            <div>
              <div className="mb-1 text-xs font-bold text-[#8b846f]">Voor welke groepen?</div>
              <div className="flex flex-wrap gap-1.5">
                {groepenOpties.map((g) => {
                  const actief = groepIds.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGroep(g.id)}
                      className="rounded-full px-3 py-1.5 text-xs font-bold"
                      style={
                        actief
                          ? { border: `1.5px solid ${g.kleur}`, background: `${g.kleur}22`, color: "#23302a" }
                          : { border: "1.5px solid #d7cfbc", background: "#fff", color: "#6f7d72" }
                      }
                    >
                      {g.naam}
                    </button>
                  );
                })}
              </div>
            </div>

            {fout && <p className="text-xs font-semibold text-[#a83e26]">{fout}</p>}

            <button
              type="submit"
              className="rounded-xl bg-primary px-3.5 py-2.5 text-sm font-extrabold text-white hover:bg-primary-2"
            >
              Toevoegen
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
