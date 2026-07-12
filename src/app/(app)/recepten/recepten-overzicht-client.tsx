"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReceptSamenvatting } from "@/lib/recepten-shared";
import { RECEPT_CATEGORIEEN, categorieLabel } from "@/lib/recepten-shared";

function statusClass(status: ReceptSamenvatting["status"]) {
  return status === "actief" ? "bg-[#dcedd8] text-[#4f7a56]" : "bg-[#e6e0d4] text-[#7b7260]";
}

function statusLabel(status: ReceptSamenvatting["status"]) {
  return status === "actief" ? "Actief" : "Concept";
}

function ReceptCard({ recept }: Readonly<{ recept: ReceptSamenvatting }>) {
  const heeftWaarschuwing = recept.ontbrekendeDietenAantal > 0 || recept.allergieOpmerkingenAantal > 0;

  return (
    <Link href={`/recepten/${recept.id}`} className="block">
      <div className="rounded-2xl border border-card-border bg-card p-3.25 text-left shadow-[0_1px_0_rgba(35,48,42,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(35,48,42,0.08)]">
        <div className="flex items-start gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8fb1c9]">
              {categorieLabel(recept.categorie)}
            </div>
            <h2 className="mt-1 font-head text-[16px] font-extrabold leading-tight tracking-tight text-[#25322b]">
              {recept.naam}
            </h2>
          </div>
          <span className={`rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide ${statusClass(recept.status)}`}>
            {statusLabel(recept.status)}
          </span>
        </div>

        <p className="mt-2.5 text-[12px] font-medium text-[#7b8477]">
          {recept.ingredientenAantal} ingred. · {recept.groepenIngepland} groepen ingepland
        </p>

        {heeftWaarschuwing && (
          <div className="mt-3 flex flex-wrap gap-1">
            {recept.ontbrekendeDietenAantal > 0 && (
              <span className="rounded-full bg-[#f8d6c0] px-2 py-0.5 text-[10px] font-bold text-[#cf6f34]">
                {recept.ontbrekendeDietenAantal} dieet{recept.ontbrekendeDietenAantal > 1 ? "en" : ""} nog in te vullen
              </span>
            )}
            {recept.allergieOpmerkingenAantal > 0 && (
              <span className="rounded-full bg-[#f8d6c0] px-2 py-0.5 text-[10px] font-bold text-[#cf6f34]">
                {recept.allergieOpmerkingenAantal} opmerking{recept.allergieOpmerkingenAantal > 1 ? "en" : ""} te controleren
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

export function ReceptenOverzichtClient({ recepten }: Readonly<{ recepten: ReceptSamenvatting[] }>) {
  const [selectedTab, setSelectedTab] = useState<"alle" | string>("alle");

  const gefilterdeRecepten = useMemo(() => {
    if (selectedTab === "alle") return recepten;
    return recepten.filter((r) => r.categorie === selectedTab);
  }, [recepten, selectedTab]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5 rounded-2xl bg-[#ece4d3] p-1.25 self-start">
        <button
          type="button"
          onClick={() => setSelectedTab("alle")}
          className={`rounded-xl px-3.5 py-1.75 text-[12px] font-bold transition-colors ${
            selectedTab === "alle" ? "bg-white text-[#33553f] shadow-sm" : "text-[#8c8b78] hover:text-[#56685e]"
          }`}
        >
          Alle
        </button>
        {RECEPT_CATEGORIEEN.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setSelectedTab(c.value)}
            className={`rounded-xl px-3.5 py-1.75 text-[12px] font-bold transition-colors ${
              selectedTab === c.value ? "bg-white text-[#33553f] shadow-sm" : "text-[#8c8b78] hover:text-[#56685e]"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {gefilterdeRecepten.length === 0 ? (
        <p className="text-sm text-[#6f7d72]">Geen recepten in deze categorie.</p>
      ) : (
        <div className="grid gap-2.5 md:grid-cols-2 2xl:grid-cols-3">
          {gefilterdeRecepten.map((recept) => (
            <ReceptCard key={recept.id} recept={recept} />
          ))}
        </div>
      )}
    </div>
  );
}
