"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_ITEMS, BOTTOM_NAV_PRIMARY_HREFS } from "@/lib/nav";
import { MeerIcon } from "@/components/icons";

export function BottomNav() {
  const pathname = usePathname();
  const [meerOpen, setMeerOpen] = useState(false);

  useEffect(() => {
    setMeerOpen(false);
  }, [pathname]);

  const primaireItems = NAV_ITEMS.filter((item) => BOTTOM_NAV_PRIMARY_HREFS.includes(item.href));
  const meerItems = NAV_ITEMS.filter((item) => !BOTTOM_NAV_PRIMARY_HREFS.includes(item.href));
  const meerActief = meerItems.some((item) => pathname.startsWith(item.href));

  return (
    <div className="md:hidden">
      {meerOpen && (
        <button
          aria-label="Sluit menu"
          onClick={() => setMeerOpen(false)}
          className="fixed inset-0 z-40 bg-[#141e18]/50"
        />
      )}

      <div
        className={`fixed inset-x-3 bottom-16 z-40 origin-bottom rounded-2xl border border-white/10 bg-sidebar p-2 shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition ${
          meerOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <div className="grid grid-cols-3 gap-1.5">
          {meerItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 ${
                  active ? "bg-white/10 text-white" : "text-[#c3d3c6]"
                }`}
              >
                <item.Icon width={20} height={20} />
                <span className="text-[11px] font-bold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 gap-1 bg-sidebar px-2 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom))]">
        {primaireItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 rounded-lg py-1.5 ${
                active ? "bg-white/10 text-white" : "text-[#7d9584]"
              }`}
            >
              <item.Icon width={20} height={20} />
              <span className="text-[10.5px] font-bold">{item.kort}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMeerOpen((v) => !v)}
          className={`flex flex-col items-center gap-0.5 rounded-lg py-1.5 ${
            meerOpen || meerActief ? "bg-white/10 text-white" : "text-[#7d9584]"
          }`}
        >
          <MeerIcon width={20} height={20} />
          <span className="text-[10.5px] font-bold">Meer</span>
        </button>
      </nav>
    </div>
  );
}
