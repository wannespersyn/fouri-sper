"use client";

import Link from "next/link";
import { useState } from "react";
import {
  updateReceptMeta,
  deleteRecept,
  addIngredientRegel,
  updateIngredientRegel,
  removeIngredientRegel,
  addDieetAanpassing,
  markDieetOk,
  removeDieetAanpassing,
} from "@/app/(app)/recepten/actions";
import { PencilIcon } from "@/components/icons";
import {
  RECEPT_CATEGORIEEN,
  RECEPT_STATUS_OPTIES,
  EENHEDEN,
  EENHEID_LABEL,
  formatGetal,
  formatHoeveelheid,
  berekenTotaal,
} from "@/lib/recepten-shared";
import type {
  DieetSectie,
  HoeveelheidModus,
  IngredientOptie,
  LeverancierOptie,
  ReceptDetail,
  ReceptIngredientRegel,
} from "@/lib/recepten-shared";

function tabClass(active: boolean) {
  return `rounded-full px-3 py-1.5 text-xs font-bold ${active ? "bg-primary text-white" : "bg-[#efe9db] text-[#6f7d72] hover:bg-[#e6dfd0]"}`;
}

// Eén plek die "per persoon" vs "vast totaal" toont — de knoppen zíjn het
// label, dus er staat nergens hetzelfde ("per persoon") nog eens apart bij.
function ModusToggle({ modus, onChange }: Readonly<{ modus: HoeveelheidModus; onChange: (m: HoeveelheidModus) => void }>) {
  return (
    <div className="flex rounded-lg border border-card-border bg-[#efe9db] p-0.5 text-xs font-bold">
      <button
        type="button"
        onClick={() => onChange("per_persoon")}
        className={`rounded-md px-2 py-1 ${modus === "per_persoon" ? "bg-white text-[#25322b] shadow-sm" : "text-[#8a8172]"}`}
      >
        Per persoon
      </button>
      <button
        type="button"
        onClick={() => onChange("vast_totaal")}
        className={`rounded-md px-2 py-1 ${modus === "vast_totaal" ? "bg-white text-[#25322b] shadow-sm" : "text-[#8a8172]"}`}
      >
        Vast totaal
      </button>
    </div>
  );
}

export function ReceptDetailClient({
  recept,
  ingredientOpties,
  leverancierOpties,
  standaardEters,
}: Readonly<{
  recept: ReceptDetail;
  ingredientOpties: IngredientOptie[];
  leverancierOpties: LeverancierOptie[];
  standaardEters: number;
}>) {
  const [eters, setEters] = useState(standaardEters);

  return (
    <div className="mx-auto flex max-w-205 flex-col gap-3.5">
      <Link href="/recepten" className="text-sm font-extrabold text-[#2f6d4f] hover:text-[#245a40]">
        ← Alle recepten
      </Link>

      <section className="rounded-[22px] border border-card-border bg-card p-4.5 shadow-[0_1px_0_rgba(35,48,42,0.04)]">
        <form action={updateReceptMeta} className="grid gap-2.5 md:grid-cols-[1.5fr_0.8fr_0.8fr_auto] md:items-end">
          <input type="hidden" name="id" value={recept.id} />
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8b846f]">Naam</span>
            <input
              name="naam"
              defaultValue={recept.naam}
              required
              className="h-9 rounded-2xl border border-card-border bg-white px-3 py-2 font-head text-[18px] font-semibold leading-tight tracking-tight text-[#25322b] outline-none focus:border-[#cbb88d]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8b846f]">Categorie</span>
            <select
              name="categorie"
              defaultValue={recept.categorie ?? ""}
              className="h-9 rounded-2xl border border-card-border bg-white px-3 py-2.5 text-sm font-semibold text-[#25322b] outline-none"
            >
              <option value="">Geen categorie</option>
              {RECEPT_CATEGORIEEN.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8b846f]">Status</span>
            <select
              name="status"
              defaultValue={recept.status}
              className="h-9 rounded-2xl border border-card-border bg-white px-3 py-2.5 text-sm font-semibold text-[#25322b] outline-none"
            >
              {RECEPT_STATUS_OPTIES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="h-9 rounded-2xl bg-primary px-4 text-sm font-extrabold text-white hover:bg-primary-2">
            Opslaan
          </button>
        </form>
        <form action={deleteRecept} className="mt-2.5">
          <input type="hidden" name="id" value={recept.id} />
          <button
            type="submit"
            onClick={(e) => {
              if (!window.confirm(`Zeker dat je "${recept.naam}" wilt verwijderen?`)) e.preventDefault();
            }}
            className="rounded-full bg-[#d26f41] px-3.5 py-2 text-sm font-extrabold text-white hover:bg-[#c05f34]"
          >
            Verwijder recept
          </button>
        </form>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-card-border bg-card p-3.5">
        <div>
          <div className="text-sm font-bold text-[#25322b]">Reken voor</div>
          <div className="text-xs text-[#6f7d72]">Hoeveelheden hieronder schalen automatisch mee</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEters((e) => Math.max(1, e - 5))}
            className="flex size-9 items-center justify-center rounded-xl border border-card-border bg-white text-lg font-bold text-[#2f6d4f]"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            value={eters}
            onChange={(e) => setEters(Math.max(1, Number(e.target.value) || 1))}
            className="w-20 rounded-xl border border-card-border bg-white px-2 py-2 text-center font-head text-xl font-extrabold text-[#243b2e]"
          />
          <button
            type="button"
            onClick={() => setEters((e) => e + 5)}
            className="flex size-9 items-center justify-center rounded-xl border border-card-border bg-white text-lg font-bold text-[#2f6d4f]"
          >
            +
          </button>
          <span className="text-sm font-semibold text-[#6f7d72]">eters</span>
        </div>
      </section>

      <section className="rounded-[22px] border border-card-border bg-card p-4.5 shadow-[0_1px_0_rgba(35,48,42,0.04)]">
        <h2 className="text-sm font-extrabold text-[#25322b]">Ingrediënten</h2>

        <div className="mt-2 flex flex-col gap-2">
          {recept.ingredienten.map((regel) => (
            <IngredientRow key={regel.id} regel={regel} receptId={recept.id} eters={eters} />
          ))}
          {recept.ingredienten.length === 0 && (
            <p className="rounded-[18px] border border-dashed border-card-border p-4 text-sm text-[#8a8172]">
              Nog geen ingrediënten toegevoegd.
            </p>
          )}
        </div>

        <NieuwIngredientForm receptId={recept.id} ingredientOpties={ingredientOpties} leverancierOpties={leverancierOpties} />
      </section>

      <section className="rounded-[22px] border border-card-border bg-card p-4.5 shadow-[0_1px_0_rgba(35,48,42,0.04)]">
        <h2 className="text-sm font-extrabold text-[#25322b]">Dieetaanpassingen</h2>
        <p className="mt-1 text-[13px] text-[#6f7d72]">
          Voor elk dieet dat iemand in het kamp nodig heeft en dat dit recept raakt, kan je hier noteren wat je
          aanpast — een simpele notitie volstaat, of je kiest meteen welk ingrediënt vervangen wordt.
        </p>

        {recept.allergieOpmerkingenAantal > 0 && (
          <div className="mt-3 rounded-lg bg-[#f8d6c0] px-3 py-2 text-[13px] font-semibold text-[#cf6f34]">
            {recept.allergieOpmerkingenAantal} persoon{recept.allergieOpmerkingenAantal > 1 ? "en" : ""} die dit recept
            eet met een vrije-tekst allergie-opmerking — controleer manueel, dit wordt niet automatisch opgelost.
          </div>
        )}

        <div className="mt-3 flex flex-col gap-2.5">
          {recept.dieetSecties.map((sectie) => (
            <DieetSectieCard key={sectie.dieettype_id} sectie={sectie} receptId={recept.id} ingredientOpties={ingredientOpties} />
          ))}
          {recept.dieetSecties.length === 0 && (
            <p className="text-sm text-[#8a8172]">Niemand in het kamp heeft momenteel een specifiek dieet nodig.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function IngredientRow({
  regel,
  receptId,
  eters,
}: Readonly<{ regel: ReceptIngredientRegel; receptId: string; eters: number }>) {
  const [editing, setEditing] = useState(false);
  const [modus, setModus] = useState<HoeveelheidModus>(regel.modus);
  const totaal = berekenTotaal(
    { modus: regel.modus, hoeveelheid_per_persoon: regel.hoeveelheid_per_persoon, vast_totaal: regel.vast_totaal },
    eters
  );

  if (editing) {
    return (
      <div className="rounded-2xl border border-[#cbb88d] bg-white p-3.5 shadow-[0_1px_0_rgba(35,48,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="min-w-36 flex-1">
            <div className="text-sm font-bold text-[#25322b]">{regel.ingredient_naam}</div>
            <div className="text-xs text-[#8a8172]">{regel.leverancier_naam ?? "Geen leverancier"}</div>
          </div>
          <ModusToggle modus={modus} onChange={setModus} />
        </div>

        <form
          action={async (formData) => {
            await updateIngredientRegel(formData);
            setEditing(false);
          }}
          className="mt-2.5 flex flex-wrap items-end gap-2.5"
        >
          <input type="hidden" name="id" value={regel.id} />
          <input type="hidden" name="recept_id" value={receptId} />
          <input type="hidden" name="modus" value={modus} />

          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-[#8b846f]">Hoeveelheid</span>
            <div className="flex items-center gap-1.5">
              {modus === "vast_totaal" ? (
                <input
                  key="vast_totaal"
                  name="vast_totaal"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={regel.vast_totaal ?? 0}
                  autoFocus
                  className="w-24 rounded-lg border border-card-border bg-[#fffdfa] px-2.5 py-1.5 text-sm"
                />
              ) : (
                <input
                  key="hoeveelheid_per_persoon"
                  name="hoeveelheid_per_persoon"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={regel.hoeveelheid_per_persoon ?? 0}
                  autoFocus
                  className="w-24 rounded-lg border border-card-border bg-[#fffdfa] px-2.5 py-1.5 text-sm"
                />
              )}
              <span className="text-xs font-semibold text-[#8a8172]">{EENHEID_LABEL[regel.eenheid]}</span>
            </div>
          </label>

          <button type="submit" className="rounded-lg bg-primary px-3.5 py-2 text-sm font-extrabold text-white hover:bg-primary-2">
            Opslaan
          </button>
          <button
            type="button"
            onClick={() => {
              setModus(regel.modus);
              setEditing(false);
            }}
            className="rounded-lg px-3 py-1.5 text-sm font-bold text-[#6f7d72] hover:bg-black/5"
          >
            Annuleer
          </button>
        </form>

        <form
          action={removeIngredientRegel}
          onSubmit={(e) => {
            if (!window.confirm(`"${regel.ingredient_naam}" verwijderen uit dit recept?`)) e.preventDefault();
          }}
          className="mt-2 border-t border-[#eadfca] pt-2"
        >
          <input type="hidden" name="id" value={regel.id} />
          <input type="hidden" name="recept_id" value={receptId} />
          <button type="submit" className="text-xs font-bold text-[#a89a80] hover:text-[#a83e26]">
            Ingrediënt verwijderen uit recept
          </button>
        </form>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="group flex w-full flex-wrap items-center gap-2.5 rounded-2xl border border-card-border bg-white px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-[#cbb88d] hover:shadow-[0_6px_16px_rgba(35,48,42,0.08)]"
    >
      <div className="min-w-36 flex-1">
        <div className="text-sm font-bold text-[#25322b]">{regel.ingredient_naam}</div>
        <div className="text-xs text-[#8a8172]">{regel.leverancier_naam ?? "Geen leverancier"}</div>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="font-head text-[15px] font-extrabold text-[#243b2e]">
          {formatGetal(regel.modus === "vast_totaal" ? regel.vast_totaal ?? 0 : regel.hoeveelheid_per_persoon ?? 0)}
        </span>
        <span className="text-xs font-semibold text-[#8a8172]">{EENHEID_LABEL[regel.eenheid]}</span>
        <span className="rounded-full bg-[#efe9db] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8a8172]">
          {regel.modus === "vast_totaal" ? "vast" : "p.p."}
        </span>
      </div>

      <span className="text-xs font-semibold text-[#6f7d72]">= {formatHoeveelheid(totaal, regel.eenheid)} totaal</span>

      <PencilIcon className="ml-auto size-3.5 flex-none text-[#c9bfa8] transition-colors group-hover:text-[#8b846f]" />
    </button>
  );
}

function NieuwIngredientForm({
  receptId,
  ingredientOpties,
  leverancierOpties,
}: Readonly<{ receptId: string; ingredientOpties: IngredientOptie[]; leverancierOpties: LeverancierOptie[] }>) {
  const [open, setOpen] = useState(false);
  const [modeNieuw, setModeNieuw] = useState(false);
  const [modus, setModus] = useState<HoeveelheidModus>("per_persoon");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 rounded-xl bg-primary px-3.5 py-2 text-sm font-extrabold text-white hover:bg-primary-2"
      >
        + Ingrediënt toevoegen
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await addIngredientRegel(formData);
        setOpen(false);
        setModeNieuw(false);
      }}
      className="mt-3 flex flex-col gap-2.5 rounded-[18px] border border-card-border bg-white p-3.5"
    >
      <input type="hidden" name="recept_id" value={receptId} />
      <input type="hidden" name="modus" value={modus} />

      <div className="flex gap-2">
        <button type="button" onClick={() => setModeNieuw(false)} className={tabClass(!modeNieuw)}>
          Bestaand ingrediënt
        </button>
        <button type="button" onClick={() => setModeNieuw(true)} className={tabClass(modeNieuw)}>
          Nieuw ingrediënt
        </button>
      </div>

      {!modeNieuw ? (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-[#8b846f]">Ingrediënt</span>
          <select
            name="ingredient_id"
            required={!modeNieuw}
            defaultValue=""
            className="rounded-lg border border-card-border bg-[#fffdfa] px-2.5 py-1.5 text-sm"
          >
            <option value="" disabled>
              Kies een ingrediënt…
            </option>
            {ingredientOpties.map((i) => (
              <option key={i.id} value={i.id}>
                {i.naam} ({EENHEID_LABEL[i.eenheid]}
                {i.leverancier_naam ? ` · ${i.leverancier_naam}` : ""})
              </option>
            ))}
          </select>
          {ingredientOpties.length === 0 && (
            <span className="text-xs text-[#8a8172]">Nog geen ingrediënten — maak er hiernaast eentje aan.</span>
          )}
        </label>
      ) : (
        <div className="grid gap-2.5 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-[#8b846f]">Naam</span>
            <input
              name="nieuw_naam"
              required={modeNieuw}
              className="h-7 rounded-lg border border-card-border bg-[#fffdfa] px-2.5 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-[#8b846f]">Eenheid</span>
            <select name="nieuw_eenheid" defaultValue="g" className="h-7 rounded-lg border border-card-border bg-[#fffdfa] px-2.5 py-1.5 text-sm">
              {EENHEDEN.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-[#8b846f]">Leverancier</span>
            <select name="nieuw_leverancier_id" defaultValue="" className="h-7 rounded-lg border border-card-border bg-[#fffdfa] px-2.5 py-1.5 text-sm">
              <option value="">Nog niet gekozen</option>
              {leverancierOpties.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.naam}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-[#8b846f]">Categorie</span>
            <input
              name="nieuw_categorie"
              placeholder="bv. Vers, Droge waren…"
              className="h-7 rounded-lg border border-card-border bg-[#fffdfa] px-2.5 py-1.5 text-sm"
            />
          </label>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2.5">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-[#8b846f]">Hoeveelheid</span>
          <div className="flex items-center gap-1.5">
            <ModusToggle modus={modus} onChange={setModus} />
            {modus === "vast_totaal" ? (
              <input name="vast_totaal" type="number" step="0.01" min={0} defaultValue={0} className="h-7 w-24 rounded-lg border border-card-border bg-[#fffdfa] px-2.5 py-1.5 text-sm" />
            ) : (
              <input
                name="hoeveelheid_per_persoon"
                type="number"
                step="0.01"
                min={0}
                defaultValue={0}
                className="h-7 w-24 rounded-lg border border-card-border bg-[#fffdfa] px-2.5 py-1.5 text-sm"
              />
            )}
          </div>
        </div>
        <button type="submit" className="rounded-lg bg-primary px-3.5 py-2 text-sm font-extrabold text-white hover:bg-primary-2">
          Toevoegen
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-3 py-1.5 text-sm font-bold text-[#6f7d72] hover:bg-black/5"
        >
          Annuleer
        </button>
      </div>
    </form>
  );
}

function DieetSectieCard({
  sectie,
  receptId,
  ingredientOpties,
}: Readonly<{ sectie: DieetSectie; receptId: string; ingredientOpties: IngredientOptie[] }>) {
  const [formOpen, setFormOpen] = useState(false);
  const [modus, setModus] = useState<HoeveelheidModus>("per_persoon");
  const ontbreekt = sectie.inGebruikInKamp && sectie.aanpassingen.length === 0;

  return (
    <div className={`rounded-[18px] border px-4 py-3 ${ontbreekt ? "border-[#f0ccb9] bg-[#fff1e9]" : "border-[#d9ead4] bg-[#f4faf0]"}`}>
      <div className="flex flex-wrap items-center gap-2.5">
        <span
          className="rounded-full px-2.5 py-1 text-xs font-bold"
          style={{ background: sectie.dieettype_kleur + "22", color: sectie.dieettype_kleur }}
        >
          {sectie.dieettype_naam}
        </span>
        {!sectie.inGebruikInKamp && <span className="text-xs text-[#8a8172]">(momenteel niemand in het kamp)</span>}
        <span className={`text-[13px] font-semibold ${ontbreekt ? "text-[#d26f41]" : "text-[#5f8c65]"}`}>
          {ontbreekt ? "Nog niet aangepast" : sectie.aanpassingen.length > 0 ? "In orde" : ""}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          {sectie.aanpassingen.length === 0 && (
            <form action={markDieetOk}>
              <input type="hidden" name="recept_id" value={receptId} />
              <input type="hidden" name="dieettype_id" value={sectie.dieettype_id} />
              <button type="submit" className="rounded-lg bg-[#4f7a56] px-2.5 py-1.5 text-xs font-bold text-white hover:bg-[#436b4a]">
                ✓ Oké zo
              </button>
            </form>
          )}
          <button
            type="button"
            onClick={() => setFormOpen((v) => !v)}
            className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#6f7d72] hover:bg-black/5"
          >
            {formOpen ? "Sluiten" : "+ Vervanging"}
          </button>
        </div>
      </div>

      {sectie.aanpassingen.length > 0 && (
        <ul className="mt-2.5 flex flex-col gap-1.5">
          {sectie.aanpassingen.map((a) => {
            const titel = a.vervangt_ingredient_naam && a.vervangen_door_ingredient_naam
              ? `${a.vervangt_ingredient_naam} → ${a.vervangen_door_ingredient_naam}`
              : a.vervangen_door_ingredient_naam
                ? `Extra: ${a.vervangen_door_ingredient_naam}`
                : a.notitie
                  ? null
                  : "Oké bevonden — geen aanpassing nodig";
            return (
              <li key={a.id} className="flex items-center gap-2.5 rounded-lg bg-white/70 px-2.5 py-1.5 text-sm">
                <span className="flex-1 font-semibold text-[#25322b]">
                  {titel}
                  {a.notitie && <span className={`font-normal text-[#6f7d72] ${titel ? "ml-1.5" : ""}`}>{a.notitie}</span>}
                </span>
                <form action={removeDieetAanpassing}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="recept_id" value={receptId} />
                  <button type="submit" className="text-xs font-bold text-[#a89a80] hover:text-[#a83e26]">
                    ×
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}

      {formOpen && (
        <form
          action={async (formData) => {
            await addDieetAanpassing(formData);
            setFormOpen(false);
          }}
          className="mt-3 flex flex-col gap-2.5 rounded-lg border border-card-border bg-white p-3"
        >
          <input type="hidden" name="recept_id" value={receptId} />
          <input type="hidden" name="dieettype_id" value={sectie.dieettype_id} />
          <input type="hidden" name="modus" value={modus} />

          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-[#8b846f]">Notitie</span>
            <input
              name="notitie"
              placeholder="bv. gebruik altijd glutenvrije pasta"
              className="rounded-lg border border-card-border bg-[#fffdfa] px-2.5 py-1.5 text-sm"
            />
          </label>

          <div className="grid gap-2.5 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-[#8b846f]">Vervangt ingrediënt (optioneel)</span>
              <select name="vervangt_ingredient_id" defaultValue="" className="rounded-lg border border-card-border bg-[#fffdfa] px-2.5 py-1.5 text-sm">
                <option value="">Geen</option>
                {ingredientOpties.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.naam}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-[#8b846f]">Vervangen door / extra ingrediënt</span>
              <select name="vervangen_door_ingredient_id" defaultValue="" className="rounded-lg border border-card-border bg-[#fffdfa] px-2.5 py-1.5 text-sm">
                <option value="">Geen</option>
                {ingredientOpties.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.naam}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-end gap-2.5">
            <button
              type="button"
              onClick={() => setModus((m) => (m === "vast_totaal" ? "per_persoon" : "vast_totaal"))}
              className="rounded-lg border border-card-border px-2.5 py-1.5 text-xs font-bold text-[#6f7d72] hover:bg-black/5"
            >
              {modus === "vast_totaal" ? "Vast totaal (klik voor per persoon)" : "Per persoon (klik voor vast totaal)"}
            </button>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-[#8b846f]">
                Hoeveelheid — enkel nodig bij een echte vervanging hierboven
              </span>
              {modus === "vast_totaal" ? (
                <input name="vast_totaal" type="number" step="0.01" min={0} className="w-28 rounded-lg border border-card-border bg-[#fffdfa] px-2.5 py-1.5 text-sm" />
              ) : (
                <input name="hoeveelheid_per_persoon" type="number" step="0.01" min={0} className="w-28 rounded-lg border border-card-border bg-[#fffdfa] px-2.5 py-1.5 text-sm" />
              )}
            </label>
            <button type="submit" className="rounded-lg bg-primary px-3.5 py-2 text-sm font-extrabold text-white hover:bg-primary-2">
              Toevoegen
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
