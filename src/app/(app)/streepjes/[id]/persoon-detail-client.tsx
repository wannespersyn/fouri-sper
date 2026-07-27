"use client";

import { useState } from "react";
import Image from "next/image";
import {
  addShussGebeurtenis,
  removeShussGebeurtenis,
  updateStreepjePersoonProfiel,
} from "@/app/(app)/streepjes/actions";
import {
  berekenPersoonOverzicht,
  berekenTruiDagen,
  gewogenTotaal,
  typeIcon,
  type StreepjePersoon,
  type StreepjeRuw,
  type StreepjeType,
} from "@/lib/streepjes-shared";
import { berekenShussTellingen, shussWinrate, type ShussGebeurtenis, type ShussSoort } from "@/lib/shuss-shared";
import { formatDatumLang } from "@/lib/date";
import { LedenIcon, PencilIcon, MinusIcon, PlusIcon, TruiIcon, TruiBolletjesIcon } from "@/components/icons";

const SHUSS_RIJEN: { soort: ShussSoort; label: string }[] = [
  { soort: "gewonnen", label: "Gewonnen" },
  { soort: "verloren", label: "Verloren" },
  { soort: "adje", label: "Adjes geschoten" },
];

export function PersoonDetailClient({
  persoon,
  personen,
  types,
  ruw,
  shussGebeurtenissen,
}: Readonly<{
  persoon: StreepjePersoon;
  personen: StreepjePersoon[];
  types: StreepjeType[];
  ruw: StreepjeRuw[];
  shussGebeurtenissen: ShussGebeurtenis[];
}>) {
  const [bewerken, setBewerken] = useState(false);
  const [fotoUitvergroot, setFotoUitvergroot] = useState(false);
  const overzicht = berekenPersoonOverzicht(ruw, persoon.id, types);
  const totaal = gewogenTotaal(overzicht.totaalPerType, types);
  const shussTellingen = berekenShussTellingen(shussGebeurtenissen, persoon.id);
  const winrate = shussWinrate(shussTellingen);
  const truien = berekenTruiDagen(ruw, personen, types).get(persoon.id) ?? {
    geel: 0,
    groen: 0,
    bolletjes: 0,
    wit: 0,
  };
  const heeftTrui = truien.geel > 0 || truien.groen > 0 || truien.bolletjes > 0 || truien.wit > 0;

  return (
    <div className="mx-auto flex max-w-205 flex-col gap-4">
      {fotoUitvergroot && persoon.fotoUrl && (
        <button
          type="button"
          onClick={() => setFotoUitvergroot(false)}
          aria-label="Foto sluiten"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <Image
            src={persoon.fotoUrl}
            alt=""
            width={800}
            height={800}
            className="max-h-full max-w-full rounded-2xl object-contain"
            unoptimized
          />
        </button>
      )}

      <div className="rounded-[22px] border border-card-border bg-card p-5">
        <div className="flex items-start gap-4">
          {persoon.fotoUrl ? (
            <button
              type="button"
              onClick={() => setFotoUitvergroot(true)}
              aria-label="Foto uitvergroten"
              className="flex-none rounded-full"
            >
              <Image
                src={persoon.fotoUrl}
                alt=""
                width={72}
                height={72}
                className="size-18 rounded-full object-cover"
                unoptimized
              />
            </button>
          ) : (
            <span className="flex size-18 flex-none items-center justify-center rounded-full bg-[#f0ede2] text-[#8a8172]">
              <LedenIcon width={32} height={32} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="whitespace-pre-wrap text-sm text-[#4f5b52]">
              {persoon.bio || "Nog geen bio ingesteld."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setBewerken((b) => !b)}
            aria-label={bewerken ? "Bewerken annuleren" : "Profiel bewerken"}
            className="flex size-9 flex-none items-center justify-center rounded-full border border-card-border text-[#4f5b52] transition active:scale-90"
          >
            <PencilIcon width={16} height={16} />
          </button>
        </div>

        {bewerken && (
          <form
            action={async (formData) => {
              await updateStreepjePersoonProfiel(formData);
              setBewerken(false);
            }}
            className="mt-4 flex flex-col gap-2.5 border-t border-card-border pt-4"
          >
            <input type="hidden" name="id" value={persoon.id} />
            <textarea
              name="bio"
              defaultValue={persoon.bio ?? ""}
              placeholder="Een leuke bio…"
              rows={3}
              className="w-full resize-none rounded-xl border border-card-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            />
            <input
              type="file"
              name="foto"
              accept="image/*"
              className="text-sm text-[#4f5b52] file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-white"
            />
            <button
              type="submit"
              className="self-start rounded-xl bg-primary px-4 py-2.5 text-sm font-extrabold text-white"
            >
              Opslaan
            </button>
          </form>
        )}
      </div>

      <div className="rounded-[22px] border border-card-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#8a8172]">Shuss</h2>
          {winrate !== null && (
            <span className="text-sm font-extrabold text-[#25322b]">
              {Math.round(winrate * 100)}% winrate ({shussTellingen.gewonnen}/{shussTellingen.gewonnen + shussTellingen.verloren})
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {SHUSS_RIJEN.map(({ soort, label }) => {
            const aantal =
              soort === "gewonnen" ? shussTellingen.gewonnen : soort === "verloren" ? shussTellingen.verloren : shussTellingen.adjes;
            return (
              <div key={soort} className="flex items-center gap-2.5">
                <span className="min-w-0 flex-1 text-sm font-semibold text-[#4f5b52]">{label}</span>
                <form action={removeShussGebeurtenis}>
                  <input type="hidden" name="streepje_persoon_id" value={persoon.id} />
                  <input type="hidden" name="soort" value={soort} />
                  <button
                    type="submit"
                    disabled={aantal === 0}
                    aria-label={`-1 ${label} voor ${persoon.naam}`}
                    className="flex size-7 flex-none items-center justify-center rounded-full border border-card-border text-[#4f5b52] transition active:scale-90 disabled:opacity-30"
                  >
                    <MinusIcon width={13} height={13} />
                  </button>
                </form>
                <span className="w-6 flex-none text-center text-sm font-extrabold">{aantal}</span>
                <form action={addShussGebeurtenis}>
                  <input type="hidden" name="streepje_persoon_id" value={persoon.id} />
                  <input type="hidden" name="soort" value={soort} />
                  <button
                    type="submit"
                    aria-label={`+1 ${label} voor ${persoon.naam}`}
                    className="flex size-7 flex-none items-center justify-center rounded-full bg-primary text-white transition active:scale-90"
                  >
                    <PlusIcon width={13} height={13} />
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-[22px] border border-card-border bg-card p-5">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#8a8172]">Totaal</h2>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          {types.map((t) => {
            const Icon = typeIcon(t.naam);
            return (
              <span key={t.id} className="flex items-center gap-1.5 text-sm font-semibold text-[#4f5b52]">
                <Icon width={16} height={16} style={{ color: t.kleur }} />
                {t.naam}: {overzicht.totaalPerType[t.id] ?? 0}
              </span>
            );
          })}
          <span className="ml-auto text-lg font-extrabold text-[#25322b]">Totaal: {totaal}</span>
        </div>
      </div>

      <div className="rounded-[22px] border border-card-border bg-card p-5">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#8a8172]">Truien</h2>
        {heeftTrui ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {truien.geel > 0 && (
              <span
                title="Gele trui — algemeen klassement"
                className="flex items-center gap-1.5 rounded-full bg-[#fef3c7] px-3 py-1.5 text-sm font-extrabold text-[#92610a]"
              >
                <TruiIcon width={16} height={16} />
                {truien.geel}
              </span>
            )}
            {truien.groen > 0 && (
              <span
                title="Groene trui — pintjesklassement"
                className="flex items-center gap-1.5 rounded-full bg-[#dcf3e6] px-3 py-1.5 text-sm font-extrabold text-[#1f6b43]"
              >
                <TruiIcon width={16} height={16} />
                {truien.groen}
              </span>
            )}
            {truien.bolletjes > 0 && (
              <span
                title="Bollentrui — sterkeklassement"
                className="flex items-center gap-1.5 rounded-full bg-[#fee2e2] px-3 py-1.5 text-sm font-extrabold text-[#b91c1c]"
              >
                <TruiBolletjesIcon width={16} height={16} />
                {truien.bolletjes}
              </span>
            )}
            {truien.wit > 0 && (
              <span
                title="Witte trui — klassement onder leiding"
                className="flex items-center gap-1.5 rounded-full bg-[#f0ede2] px-3 py-1.5 text-sm font-extrabold text-[#25322b]"
              >
                <TruiIcon width={16} height={16} />
                {truien.wit}
              </span>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#6f7d72]">Nog geen enkele trui gedragen.</p>
        )}
      </div>

      <div className="rounded-[22px] border border-card-border bg-card p-5">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#8a8172]">Per dag</h2>
        {overzicht.perDag.length === 0 ? (
          <p className="mt-3 text-sm text-[#6f7d72]">Nog geen streepjes gezet.</p>
        ) : (
          <div className="mt-3 flex flex-col divide-y divide-card-border">
            {overzicht.perDag.map(({ dag, aantalPerType }) => {
              const dagTotaal = gewogenTotaal(aantalPerType, types);
              return (
                <div key={dag} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-2.5">
                  <span className="text-sm font-bold capitalize">{formatDatumLang(dag)}</span>
                  {types.map((t) => {
                    const aantal = aantalPerType[t.id] ?? 0;
                    if (aantal === 0) return null;
                    const Icon = typeIcon(t.naam);
                    return (
                      <span key={t.id} className="flex items-center gap-1 text-sm text-[#4f5b52]">
                        <Icon width={14} height={14} style={{ color: t.kleur }} />
                        {aantal}
                      </span>
                    );
                  })}
                  <span className="ml-auto text-sm font-extrabold text-[#25322b]">{dagTotaal}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
