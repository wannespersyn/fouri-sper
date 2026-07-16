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
import { berekenShussLeaderboard, type ShussGebeurtenis } from "@/lib/shuss-shared";
import { formatDatumLang, voegDagenToe } from "@/lib/date";
import { LedenIcon } from "@/components/icons";

const MEDAILLE_KLEUREN = ["#c8a13a", "#9aa0a6", "#a8703f"];

export function LeaderboardClient({
  personen,
  types,
  ruw,
  shussGebeurtenissen,
}: Readonly<{
  personen: StreepjePersoon[];
  types: StreepjeType[];
  ruw: StreepjeRuw[];
  shussGebeurtenissen: ShussGebeurtenis[];
}>) {
  const [weergave, setWeergave] = useState<"streepjes" | "shuss">("streepjes");
  const [modus, setModus] = useState<"totaal" | "dag">("dag");
  const [dag, setDag] = useState(() => huidigeStreepjesDag());
  const [typeId, setTypeId] = useState<string | null>(null);
  const [shussModus, setShussModus] = useState<"winrate" | "adjes">("winrate");

  const ranglijst = berekenLeaderboard(ruw, personen, {
    dag: modus === "dag" ? dag : undefined,
    typeId: typeId ?? undefined,
  });
  const shussRanglijst = berekenShussLeaderboard(shussGebeurtenissen, personen, shussModus);

  return (
    <div className="flex flex-1 flex-col overflow-hidden p-3.5 sm:p-5.5">
      <div className="flex flex-none gap-2">
        <button
          type="button"
          onClick={() => setWeergave("streepjes")}
          className={`flex-1 rounded-xl px-4 py-2 text-sm font-extrabold transition ${
            weergave === "streepjes" ? "bg-[#25322b] text-white" : "border border-card-border bg-card text-[#4f5b52]"
          }`}
        >
          Streepjes
        </button>
        <button
          type="button"
          onClick={() => setWeergave("shuss")}
          className={`flex-1 rounded-xl px-4 py-2 text-sm font-extrabold transition ${
            weergave === "shuss" ? "bg-[#25322b] text-white" : "border border-card-border bg-card text-[#4f5b52]"
          }`}
        >
          Shuss
        </button>
      </div>

      {weergave === "shuss" ? (
        <>
          <div className="mt-2 flex flex-none gap-2">
            <button
              type="button"
              onClick={() => setShussModus("winrate")}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-extrabold transition ${
                shussModus === "winrate" ? "bg-primary text-white" : "border border-card-border bg-card text-[#4f5b52]"
              }`}
            >
              Winrate
            </button>
            <button
              type="button"
              onClick={() => setShussModus("adjes")}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-extrabold transition ${
                shussModus === "adjes" ? "bg-primary text-white" : "border border-card-border bg-card text-[#4f5b52]"
              }`}
            >
              Adjes
            </button>
          </div>

          <div className="mt-3 flex-1 overflow-auto">
            {shussRanglijst.length === 0 ? (
              <p className="mt-6 text-center text-sm text-[#6f7d72]">Nog geen Shuss-partijen gespeeld.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {shussRanglijst.map((r, i) => (
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
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-base font-bold">{r.persoon.naam}</div>
                      <div className="text-xs font-semibold text-[#8a8172]">
                        {r.tellingen.gewonnen}/{r.tellingen.gewonnen + r.tellingen.verloren} gewonnen
                      </div>
                    </div>
                    <span className="flex-none text-lg font-extrabold text-[#25322b]">
                      {shussModus === "winrate" ? `${Math.round((r.winrate ?? 0) * 100)}%` : r.tellingen.adjes}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="mt-2 flex flex-none gap-2">
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
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-base font-bold">{r.persoon.naam}</div>
                      {typeId === null && types.length > 1 && (
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                          {types.map((t) => {
                            const aantal = r.perType[t.id] ?? 0;
                            if (aantal === 0) return null;
                            const Icon = typeIcon(t.naam);
                            return (
                              <span key={t.id} className="flex items-center gap-1 text-xs font-semibold text-[#8a8172]">
                                <Icon width={12} height={12} style={{ color: t.kleur }} />
                                {aantal}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex-none text-right">
                      <div className="text-lg font-extrabold text-[#25322b]">{r.aantal}</div>
                      {modus === "totaal" && (
                        <div className="text-xs font-semibold text-[#8a8172]">
                          {r.gemiddeldePerDag.toLocaleString("nl-BE", { maximumFractionDigits: 1 })}/dag
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
