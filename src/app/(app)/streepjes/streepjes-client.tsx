"use client";

import { useState } from "react";
import {
  addStreepje,
  addStreepjePersoon,
  removeStreepje,
  toggleStreepjePersoonFavoriet,
} from "@/app/(app)/streepjes/actions";
import {
  zoekPersonen,
  typeIcon,
  berekenPersoonOverzicht,
  gewogenTotaal,
  type StreepjePersoon,
  type StreepjeRuw,
  type StreepjeType,
} from "@/lib/streepjes-shared";
import { formatDatumLang } from "@/lib/date";
import { StarIcon, CheckIcon, PlusIcon, MinusIcon, LedenIcon } from "@/components/icons";
import Link from "next/link";
import Image from "next/image";

const FLASH_DUUR_MS = 500;

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

  const resultaten = zoekPersonen(personen, query);
  const favorieten = resultaten.filter((p) => p.favoriet);
  const anderen = resultaten.filter((p) => !p.favoriet);

  function flash(persoonId: string, typeId: string) {
    const key = `${persoonId}:${typeId}`;
    setFlashKey(key);
    window.setTimeout(() => setFlashKey((k) => (k === key ? null : k)), FLASH_DUUR_MS);
  }

  function renderPersoonKaart(p: StreepjePersoon) {
    const uitgeklapt = uitgeklaptId === p.id;
    const overzicht = uitgeklapt ? berekenPersoonOverzicht(ruw, p.id, types) : null;
    const persoonTellingen = overzicht?.totaalPerType ?? {};
    const totaal = gewogenTotaal(persoonTellingen, types);

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

          <span className="min-w-0 flex-1 truncate text-base font-bold">{p.naam}</span>

          <div className="flex flex-none items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {types.map((t) => {
              const key = `${p.id}:${t.id}`;
              const geflashed = flashKey === key;
              const Icon = typeIcon(t.naam);
              return (
                <form key={t.id} action={addStreepje} onSubmit={() => flash(p.id, t.id)}>
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
                    <form action={removeStreepje} onSubmit={() => flash(p.id, t.id)}>
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
