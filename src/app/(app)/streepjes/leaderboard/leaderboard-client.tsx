"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  berekenLeaderboard,
  huidigeStreepjesDag,
  typeIcon,
  type StreepjePersoon,
  type StreepjeRuw,
  type StreepjeType,
} from "@/lib/streepjes-shared";
import { formatDatumLang, voegDagenToe } from "@/lib/date";
import { LedenIcon } from "@/components/icons";

const MEDAILLE_KLEUREN = ["#c8a13a", "#9aa0a6", "#a8703f"];

export function LeaderboardClient({
  personen,
  types,
  ruw,
}: Readonly<{
  personen: StreepjePersoon[];
  types: StreepjeType[];
  ruw: StreepjeRuw[];
}>) {
  const [modus, setModus] = useState<"totaal" | "dag">("dag");
  const [dag, setDag] = useState(() => huidigeStreepjesDag());
  const [typeId, setTypeId] = useState<string | null>(null);

  const ranglijst = berekenLeaderboard(ruw, personen, {
    dag: modus === "dag" ? dag : undefined,
    typeId: typeId ?? undefined,
  });

  return (
    <div className="flex flex-1 flex-col overflow-hidden p-3.5 sm:p-5.5">
      <div className="flex flex-none gap-2">
        <button
          type="button"
          onClick={() => setModus("dag")}
          className={`flex-1 rounded-xl px-4 py-2 text-sm font-extrabold transition ${
            modus === "dag" ? "bg-primary text-white" : "border border-card-border bg-card text-[#4f5b52]"
          }`}
        >
          Per dag
        </button>
        <button
          type="button"
          onClick={() => setModus("totaal")}
          className={`flex-1 rounded-xl px-4 py-2 text-sm font-extrabold transition ${
            modus === "totaal" ? "bg-primary text-white" : "border border-card-border bg-card text-[#4f5b52]"
          }`}
        >
          Totaal
        </button>
      </div>

      {types.length > 0 && (
        <div className="mt-2 flex flex-none flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setTypeId(null)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold transition ${
              typeId === null ? "bg-[#25322b] text-white" : "border border-card-border bg-card text-[#4f5b52]"
            }`}
          >
            Alle
          </button>
          {types.map((t) => {
            const Icon = typeIcon(t.naam);
            const actief = typeId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTypeId(t.id)}
                className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold text-white transition"
                style={{ background: actief ? t.kleur : "#c7c2b4" }}
              >
                <Icon width={13} height={13} />
                {t.naam}
              </button>
            );
          })}
        </div>
      )}

      {modus === "dag" && (
        <div className="mt-3 flex flex-none items-center justify-between gap-2 rounded-xl border border-card-border bg-card px-3 py-2">
          <button
            type="button"
            aria-label="Vorige dag"
            onClick={() => setDag((d) => voegDagenToe(d, -1))}
            className="flex size-8 flex-none items-center justify-center rounded-full text-lg font-extrabold text-[#4f5b52]"
          >
            ‹
          </button>
          <span className="text-sm font-bold capitalize">
            {formatDatumLang(dag)}
            {dag === huidigeStreepjesDag() && " (vandaag)"}
          </span>
          <button
            type="button"
            aria-label="Volgende dag"
            disabled={dag >= huidigeStreepjesDag()}
            onClick={() => setDag((d) => voegDagenToe(d, 1))}
            className="flex size-8 flex-none items-center justify-center rounded-full text-lg font-extrabold text-[#4f5b52] disabled:opacity-30"
          >
            ›
          </button>
        </div>
      )}

      <div className="mt-3 flex-1 overflow-auto">
        {ranglijst.length === 0 ? (
          <p className="mt-6 text-center text-sm text-[#6f7d72]">
            {modus === "dag" ? "Nog geen streepjes deze dag." : "Nog geen streepjes gezet."}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {ranglijst.map((r, i) => (
              <Link
                key={r.persoon.id}
                href={`/streepjes/${r.persoon.id}`}
                className="flex items-center gap-3 rounded-2xl border border-card-border bg-card p-3 transition active:bg-[#f6f3ea]"
              >
                <span
                  className="flex size-7 flex-none items-center justify-center rounded-full text-sm font-extrabold text-white"
                  style={{ background: MEDAILLE_KLEUREN[i] ?? "#c7c2b4" }}
                >
                  {i + 1}
                </span>
                {r.persoon.fotoUrl ? (
                  <Image
                    src={r.persoon.fotoUrl}
                    alt=""
                    width={36}
                    height={36}
                    className="size-9 flex-none rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="flex size-9 flex-none items-center justify-center rounded-full bg-[#f0ede2] text-[#8a8172]">
                    <LedenIcon width={17} height={17} />
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-base font-bold">{r.persoon.naam}</span>
                <span className="flex-none text-lg font-extrabold text-[#25322b]">{r.aantal}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
