"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  berekenLeaderboard,
  huidigeStreepjesDag,
  rangschikTruiTellingen,
  typeIcon,
  TRUI_KLEUREN,
  type StreepjePersoon,
  type StreepjeRuw,
  type StreepjeTruiKleur,
  type StreepjeType,
} from "@/lib/streepjes-shared";
import { berekenShussLeaderboard, type ShussGebeurtenis } from "@/lib/shuss-shared";
import { formatDatumLang, voegDagenToe } from "@/lib/date";
import { LedenIcon } from "@/components/icons";
import { TRUI_INFO } from "@/lib/trui-info";

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
  const zoekParams = useSearchParams();
  const [weergave, setWeergave] = useState<"streepjes" | "shuss" | "truien">("streepjes");
  // Vanaf het profiel kan je doorklikken naar de totale stand op een
  // specifieke dag waarop je een trui droeg — die komt dan mee als
  // ?modus=totaal&dag=... i.p.v. altijd op vandaag te starten.
  const [modus, setModus] = useState<"totaal" | "dag">(() => (zoekParams.get("modus") === "totaal" ? "totaal" : "dag"));
  const [dag, setDag] = useState(() => zoekParams.get("dag") ?? huidigeStreepjesDag());
  const [typeId, setTypeId] = useState<string | null>(null);
  const [shussModus, setShussModus] = useState<"winrate" | "adjes">("winrate");
  const [truiKleur, setTruiKleur] = useState<StreepjeTruiKleur | null>(null);
  const [prijzen, setPrijzen] = useState<Record<string, number>>({});

  const ranglijst = berekenLeaderboard(ruw, personen, types, {
    dag: modus === "dag" ? dag : undefined,
    totEnMetDag: modus === "totaal" ? dag : undefined,
    typeId: typeId ?? undefined,
  });
  const shussRanglijst = berekenShussLeaderboard(shussGebeurtenissen, personen, shussModus);
  const truiRanglijst = rangschikTruiTellingen(ruw, personen, types, { kleur: truiKleur ?? undefined });
  const truiKolomInfo = truiKleur ? TRUI_INFO[truiKleur] : null;

  // Los van de dag/type-filters hierboven — de export is altijd het volledige
  // kampoverzicht, alle soorten samen.
  const exportRanglijst = berekenLeaderboard(ruw, personen, types);

  // CSV i.p.v. een echt .xlsx-bestand: geen extra library nodig en het opent
  // gewoon in Excel. `;` als scheidingsteken en `,` als decimaalteken, want
  // Excel in BE/NL verwacht dat standaard i.p.v. de Engelse `,`/`.`-indeling.
  function exporteerCsv() {
    const scheidingsteken = ";";
    const veld = (v: string) =>
      v.includes(scheidingsteken) || v.includes('"') || v.includes("\n") ? `"${v.replaceAll('"', '""')}"` : v;
    const bedrag = (n: number) => n.toFixed(2).replace(".", ",");

    const header = ["Naam", ...types.flatMap((t) => [`${t.naam} (aantal)`, `${t.naam} (bedrag)`]), "Totaal bedrag"];
    const rijen = exportRanglijst.map((r) => {
      let totaalBedrag = 0;
      const cellen = types.flatMap((t) => {
        const aantal = r.perType[t.id] ?? 0;
        const bedragType = aantal * (prijzen[t.id] ?? 0);
        totaalBedrag += bedragType;
        return [String(aantal), bedrag(bedragType)];
      });
      return [r.persoon.naam, ...cellen, bedrag(totaalBedrag)];
    });

    const csv = [header, ...rijen].map((rij) => rij.map(veld).join(scheidingsteken)).join("\r\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `streepjes-${huidigeStreepjesDag()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

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
          onClick={() => setWeergave("truien")}
          className={`flex-1 rounded-xl px-4 py-2 text-sm font-extrabold transition ${
            weergave === "truien" ? "bg-[#25322b] text-white" : "border border-card-border bg-card text-[#4f5b52]"
          }`}
        >
          Truien
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

      {weergave === "shuss" && (
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

          {shussModus === "winrate" && (
            <p className="mt-1.5 text-xs text-[#8a8172]">
              Gerangschikt met correctie voor aantal partijen — 1 gewonnen potje op 1 telt lichter dan 9 op 10.
            </p>
          )}

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
      )}

      {weergave === "streepjes" && (
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
              {modus === "totaal" && "T/m "}
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

          {modus === "totaal" && types.length > 0 && (
            <div className="mt-3 flex flex-none flex-col gap-2 rounded-xl border border-card-border bg-card px-3 py-2.5">
              <span className="text-xs font-extrabold text-[#4f5b52]">Prijs per streepje</span>
              <div className="flex flex-wrap gap-3">
                {types.map((t) => (
                  <label key={t.id} className="flex items-center gap-1.5 text-sm font-semibold text-[#4f5b52]">
                    {t.naam}
                    <span className="flex items-center gap-1 rounded-lg border border-card-border bg-[#faf8f2] px-2 py-1">
                      <span>€</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={0.1}
                        value={prijzen[t.id] ?? ""}
                        placeholder="0"
                        onChange={(e) =>
                          setPrijzen((p) => ({ ...p, [t.id]: e.target.value === "" ? 0 : Number(e.target.value) }))
                        }
                        className="w-14 bg-transparent text-sm font-bold outline-none"
                      />
                    </span>
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={exporteerCsv}
                className="mt-1 flex-none self-start rounded-xl bg-primary px-4 py-2 text-sm font-extrabold text-white transition active:scale-95"
              >
                Exporteer naar Excel
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

      {weergave === "truien" && (
        <>
          <div className="mt-2 flex flex-none flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setTruiKleur(null)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold transition ${
                truiKleur === null ? "bg-[#25322b] text-white" : "border border-card-border bg-card text-[#4f5b52]"
              }`}
            >
              Alle
            </button>
            {TRUI_KLEUREN.map((kleur) => {
              const info = TRUI_INFO[kleur];
              const Icon = info.icon;
              const actief = truiKleur === kleur;
              return (
                <button
                  key={kleur}
                  type="button"
                  onClick={() => setTruiKleur(kleur)}
                  className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold transition"
                  style={actief ? { background: info.bg, color: info.tekst } : { background: "#c7c2b4", color: "#fff" }}
                >
                  <Icon width={13} height={13} />
                  {info.label}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex-1 overflow-auto">
            {truiRanglijst.length === 0 ? (
              <p className="mt-6 text-center text-sm text-[#6f7d72]">
                {truiKleur ? `Nog niemand droeg de ${TRUI_INFO[truiKleur].label.toLowerCase()}e trui.` : "Nog geen enkele trui uitgereikt."}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {truiRanglijst.map((r, i) => (
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
                    <div className="min-w-0 flex-1 truncate text-base font-bold">{r.persoon.naam}</div>
                    {truiKleur && truiKolomInfo ? (
                      <span
                        className="flex flex-none items-center gap-1.5 text-lg font-extrabold"
                        style={{ color: truiKolomInfo.tekst }}
                      >
                        <truiKolomInfo.icon width={18} height={18} />
                        {r.truien[truiKleur]}
                      </span>
                    ) : (
                      <div className="flex flex-none flex-wrap justify-end gap-1">
                        {TRUI_KLEUREN.filter((kleur) => r.truien[kleur] > 0).map((kleur) => {
                          const info = TRUI_INFO[kleur];
                          const Icon = info.icon;
                          return (
                            <span
                              key={kleur}
                              title={`${info.label} — ${r.truien[kleur]} dag${r.truien[kleur] === 1 ? "" : "en"}`}
                              className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-extrabold"
                              style={{ background: info.bg, color: info.tekst }}
                            >
                              <Icon width={13} height={13} />
                              {r.truien[kleur]}
                            </span>
                          );
                        })}
                      </div>
                    )}
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
