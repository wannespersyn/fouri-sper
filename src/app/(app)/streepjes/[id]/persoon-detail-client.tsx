"use client";

import { useState } from "react";
import Image from "next/image";
import { updateStreepjePersoonProfiel } from "@/app/(app)/streepjes/actions";
import {
  berekenPersoonOverzicht,
  typeIcon,
  type StreepjePersoon,
  type StreepjeRuw,
  type StreepjeType,
} from "@/lib/streepjes-shared";
import { formatDatumLang } from "@/lib/date";
import { LedenIcon, PencilIcon } from "@/components/icons";

export function PersoonDetailClient({
  persoon,
  types,
  ruw,
}: Readonly<{
  persoon: StreepjePersoon;
  types: StreepjeType[];
  ruw: StreepjeRuw[];
}>) {
  const [bewerken, setBewerken] = useState(false);
  const overzicht = berekenPersoonOverzicht(ruw, persoon.id, types);
  const totaal = Object.values(overzicht.totaalPerType).reduce((som, aantal) => som + aantal, 0);

  return (
    <div className="mx-auto flex max-w-205 flex-col gap-4">
      <div className="rounded-[22px] border border-card-border bg-card p-5">
        <div className="flex items-start gap-4">
          {persoon.fotoUrl ? (
            <Image
              src={persoon.fotoUrl}
              alt=""
              width={72}
              height={72}
              className="size-18 flex-none rounded-full object-cover"
              unoptimized
            />
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
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#8a8172]">Per dag</h2>
        {overzicht.perDag.length === 0 ? (
          <p className="mt-3 text-sm text-[#6f7d72]">Nog geen streepjes gezet.</p>
        ) : (
          <div className="mt-3 flex flex-col divide-y divide-card-border">
            {overzicht.perDag.map(({ dag, aantalPerType }) => {
              const dagTotaal = Object.values(aantalPerType).reduce((som, aantal) => som + aantal, 0);
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
