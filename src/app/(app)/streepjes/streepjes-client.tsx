"use client";

import { useState } from "react";
import {
  addStreepje,
  addStreepjePersoon,
  removeStreepje,
  toggleStreepjePersoonFavoriet,
  toggleStreepjePersoonLeiding,
} from "@/app/(app)/streepjes/actions";
import {
  zoekPersonen,
  typeIcon,
  streepjesDag,
  berekenPersoonOverzicht,
  gewogenTotaal,
  type StreepjePersoon,
  type StreepjeRuw,
  type StreepjeType,
} from "@/lib/streepjes-shared";
import { formatDatumLang } from "@/lib/date";
import {
  StarIcon,
  CheckIcon,
  PlusIcon,
  MinusIcon,
  LedenIcon,
  BierIcon,
  SterkeIcon,
  LeidingIcon,
} from "@/components/icons";
import Link from "next/link";
import Image from "next/image";

const FLASH_DUUR_MS = 500;

// Aantal streepjesdagen waarop deze persoon de meeste streepjes had van een
// subset types (bv. alle "bier"-achtige soorten samen) — elke dag heeft zijn
// eigen winnaar(s), dus over het hele kamp heen kan iemand er meerdere
// winnen. Dit aantal is de "streak"-teller naast de naam in de lijst.
function dagWinstTellingen(ruw: StreepjeRuw[], typeIds: string[]): Map<string, number> {
  const perDagPerPersoon = new Map<string, Map<string, number>>();
  for (const s of ruw) {
    if (!typeIds.includes(s.streepje_type_id)) continue;
    const dag = streepjesDag(s.created_at);
    const perPersoon = perDagPerPersoon.get(dag) ?? new Map<string, number>();
    perPersoon.set(s.streepje_persoon_id, (perPersoon.get(s.streepje_persoon_id) ?? 0) + 1);
    perDagPerPersoon.set(dag, perPersoon);
  }

  const tellingen = new Map<string, number>();
  for (const perPersoon of perDagPerPersoon.values()) {
    const dagMax = Math.max(...perPersoon.values());
    if (dagMax === 0) continue;
    for (const [persoonId, aantal] of perPersoon) {
      if (aantal === dagMax) tellingen.set(persoonId, (tellingen.get(persoonId) ?? 0) + 1);
    }
  }
  return tellingen;
}

export function StreepjesClient({
  personen,
  types,
  ruw,
}: Readonly<{
  personen: StreepjePersoon[];
  types: StreepjeType[];
  ruw: StreepjeRuw[];
}>) {
  const [query, setQuery] = useState("");
  const [flashKey, setFlashKey] = useState<string | null>(null);
  const [nieuweNaam, setNieuweNaam] = useState("");
  const [toevoegenOpen, setToevoegenOpen] = useState(false);
  const [uitgeklaptId, setUitgeklaptId] = useState<string | null>(null);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);

  const resultaten = zoekPersonen(personen, query);
  const favorieten = resultaten.filter((p) => p.favoriet);
  const anderen = resultaten.filter((p) => !p.favoriet);

  // Wie op minstens 1 dag de meeste bier/sterke had, krijgt een badge met het
  // aantal gewonnen dagen naast de naam in de lijst.
  const bierTypeIds = types.filter((t) => typeIcon(t.naam) === BierIcon).map((t) => t.id);
  const sterkeTypeIds = types.filter((t) => typeIcon(t.naam) === SterkeIcon).map((t) => t.id);
  const bierWinstTellingen = dagWinstTellingen(ruw, bierTypeIds);
  const sterkeWinstTellingen = dagWinstTellingen(ruw, sterkeTypeIds);

  function flash(persoonId: string, typeId: string) {
    setFoutmelding(null);
    const key = `${persoonId}:${typeId}`;
    setFlashKey(key);
    window.setTimeout(() => setFlashKey((k) => (k === key ? null : k)), FLASH_DUUR_MS);
  }

  async function handleAddStreepje(formData: FormData) {
    const resultaat = await addStreepje(formData);
    if (!resultaat.ok) setFoutmelding(resultaat.error);
  }

  async function handleRemoveStreepje(formData: FormData) {
    const resultaat = await removeStreepje(formData);
    if (!resultaat.ok) setFoutmelding(resultaat.error);
  }

  function renderPersoonKaart(p: StreepjePersoon) {
    const uitgeklapt = uitgeklaptId === p.id;
    const overzicht = uitgeklapt ? berekenPersoonOverzicht(ruw, p.id, types) : null;
    const persoonTellingen = overzicht?.totaalPerType ?? {};
    const totaal = gewogenTotaal(persoonTellingen, types);

    const bierWins = bierWinstTellingen.get(p.id) ?? 0;
    const sterkeWins = sterkeWinstTellingen.get(p.id) ?? 0;

    return (
      <div
        key={p.id}
        role="button"
        tabIndex={0}
        onClick={() => setUitgeklaptId((id) => (id === p.id ? null : p.id))}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          setUitgeklaptId((id) => (id === p.id ? null : p.id));
        }}
        className="cursor-pointer rounded-2xl border border-card-border bg-card p-3 transition active:bg-[#f6f3ea]"
      >
        <div className="flex items-center gap-2">
          <Link
            href={`/streepjes/${p.id}`}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Profiel van ${p.naam}`}
            className="flex-none"
          >
            {p.fotoUrl ? (
              <Image
                src={p.fotoUrl}
                alt=""
                width={32}
                height={32}
                className="size-8 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <span className="flex size-8 items-center justify-center rounded-full bg-[#f0ede2] text-[#8a8172]">
                <LedenIcon width={15} height={15} />
              </span>
            )}
          </Link>

          <form action={toggleStreepjePersoonFavoriet} onClick={(e) => e.stopPropagation()}>
            <input type="hidden" name="id" value={p.id} />
            <input type="hidden" name="huidig" value={String(p.favoriet)} />
            <button
              type="submit"
              aria-label={p.favoriet ? "Favoriet verwijderen" : "Favoriet maken"}
              className="flex size-8 flex-none items-center justify-center rounded-full text-[#c8a13a]"
            >
              <StarIcon width={19} height={19} fill={p.favoriet ? "currentColor" : "none"} />
            </button>
          </form>

          <form action={toggleStreepjePersoonLeiding} onClick={(e) => e.stopPropagation()}>
            <input type="hidden" name="id" value={p.id} />
            <input type="hidden" name="huidig" value={String(p.leiding)} />
            <button
              type="submit"
              aria-label={p.leiding ? "Leiding-status verwijderen" : "Als leiding markeren"}
              title={p.leiding ? "Leiding" : "Markeer als leiding"}
              className="flex size-8 flex-none items-center justify-center rounded-full text-[#2f6d4f]"
            >
              <LeidingIcon width={17} height={17} fill={p.leiding ? "currentColor" : "none"} />
            </button>
          </form>

          <span className="min-w-0 flex-1 truncate text-base font-bold">{p.naam}</span>

          {bierWins > 0 && (
            <span
              title={`${bierWins}× dagwinnaar bier`}
              className="flex flex-none items-center gap-0.5 rounded-full bg-[#fef3c7] px-1.5 py-0.5 text-xs font-extrabold text-[#92610a]"
            >
              <BierIcon width={11} height={11} />
              {bierWins}
            </span>
          )}
          {sterkeWins > 0 && (
            <span
              title={`${sterkeWins}× dagwinnaar sterke`}
              className="flex flex-none items-center gap-0.5 rounded-full bg-[#fee2e2] px-1.5 py-0.5 text-xs font-extrabold text-[#b91c1c]"
            >
              <SterkeIcon width={11} height={11} />
              {sterkeWins}
            </span>
          )}

          <div className="flex flex-none items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {types.map((t) => {
              const key = `${p.id}:${t.id}`;
              const geflashed = flashKey === key;
              const Icon = typeIcon(t.naam);
              return (
                <form key={t.id} action={handleAddStreepje} onSubmit={() => flash(p.id, t.id)}>
                  <input type="hidden" name="streepje_persoon_id" value={p.id} />
                  <input type="hidden" name="streepje_type_id" value={t.id} />
                  <button
                    type="submit"
                    disabled={geflashed}
                    aria-label={`+1 ${t.naam} voor ${p.naam}`}
                    className="flex size-11 flex-none items-center justify-center rounded-full text-white transition active:scale-90 disabled:opacity-60"
                    style={{ background: t.kleur }}
                  >
                    {geflashed ? <CheckIcon width={20} height={20} /> : <Icon width={20} height={20} />}
                  </button>
                </form>
              );
            })}
          </div>
        </div>

        {uitgeklapt && overzicht && (
          <div className="mt-2.5 border-t border-card-border pt-2.5 text-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {types.map((t) => {
                const Icon = typeIcon(t.naam);
                const aantal = persoonTellingen[t.id] ?? 0;
                const geflashed = flashKey === `${p.id}:${t.id}`;
                return (
                  <span key={t.id} className="flex items-center gap-1.5 font-semibold text-[#4f5b52]">
                    <Icon width={15} height={15} style={{ color: t.kleur }} />
                    {t.naam}: {aantal}
                    <form action={handleRemoveStreepje} onSubmit={() => flash(p.id, t.id)}>
                      <input type="hidden" name="streepje_persoon_id" value={p.id} />
                      <input type="hidden" name="streepje_type_id" value={t.id} />
                      <button
                        type="submit"
                        disabled={aantal === 0 || geflashed}
                        aria-label={`-1 ${t.naam} voor ${p.naam}`}
                        className="flex size-5 flex-none items-center justify-center rounded-full border border-card-border text-[#4f5b52] transition active:scale-90 disabled:opacity-30"
                      >
                        <MinusIcon width={12} height={12} />
                      </button>
                    </form>
                  </span>
                );
              })}
              <span className="ml-auto font-extrabold text-[#25322b]">Totaal: {totaal}</span>
            </div>

            {overzicht.perDag.length > 0 && (
              <div className="mt-2.5 flex flex-col divide-y divide-card-border border-t border-card-border">
                {overzicht.perDag.map(({ dag, aantalPerType }) => {
                  const dagTotaal = gewogenTotaal(aantalPerType, types);
                  return (
                    <div key={dag} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1.5">
                      <span className="font-bold capitalize text-[#4f5b52]">{formatDatumLang(dag)}</span>
                      {types.map((t) => {
                        const aantal = aantalPerType[t.id] ?? 0;
                        if (aantal === 0) return null;
                        const Icon = typeIcon(t.naam);
                        return (
                          <span key={t.id} className="flex items-center gap-1 text-[#4f5b52]">
                            <Icon width={13} height={13} style={{ color: t.kleur }} />
                            {aantal}
                          </span>
                        );
                      })}
                      <span className="ml-auto font-extrabold text-[#25322b]">{dagTotaal}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden p-3.5 sm:p-5.5">
      <div className="flex flex-none gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek een naam…"
          className="min-w-0 flex-1 rounded-xl border border-card-border bg-card px-4.5 py-1.5 text-base outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={() => setToevoegenOpen((open) => !open)}
          aria-label={toevoegenOpen ? "Nieuwe naam annuleren" : "Nieuwe naam toevoegen"}
          aria-expanded={toevoegenOpen}
          className="flex size-11 flex-none items-center justify-center rounded-xl bg-primary text-white transition active:scale-90"
        >
          <PlusIcon width={20} height={20} className={toevoegenOpen ? "rotate-45 transition" : "transition"} />
        </button>
      </div>

      {toevoegenOpen && (
        <form
          action={async (formData) => {
            await addStreepjePersoon(formData);
            setNieuweNaam("");
            setToevoegenOpen(false);
          }}
          className="mt-2 flex flex-none gap-2"
        >
          <input
            name="naam"
            autoFocus
            value={nieuweNaam}
            onChange={(e) => setNieuweNaam(e.target.value)}
            placeholder="Naam van de nieuwe persoon…"
            className="min-w-0 flex-1 rounded-xl border border-card-border bg-card px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={!nieuweNaam.trim()}
            className="flex-none rounded-xl bg-primary px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-40"
          >
            Toevoegen
          </button>
        </form>
      )}

      {foutmelding && (
        <p className="mt-2 flex-none rounded-xl bg-[#f7e2dc] px-3.5 py-2 text-xs font-semibold text-[#a83e26]">
          {foutmelding}
        </p>
      )}

      <div className="mt-3 flex-1 overflow-auto">
        {types.length === 0 ? (
          <p className="mt-6 text-center text-sm text-[#6f7d72]">
            Nog geen soorten ingesteld voor dit kamp — voeg er eerst een toe via het overzicht.
          </p>
        ) : resultaten.length === 0 ? (
          <p className="mt-6 text-center text-sm text-[#6f7d72]">
            Niemand gevonden — voeg de naam hierboven toe.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {favorieten.length > 0 && (
              <div className="px-1 text-[11px] font-extrabold uppercase tracking-wide text-[#8a8172]">
                Favorieten
              </div>
            )}
            {favorieten.map(renderPersoonKaart)}
            {favorieten.length > 0 && anderen.length > 0 && (
              <div className="mt-2 px-1 text-[11px] font-extrabold uppercase tracking-wide text-[#8a8172]">
                Anderen
              </div>
            )}
            {anderen.map(renderPersoonKaart)}
          </div>
        )}
      </div>
    </div>
  );
}
