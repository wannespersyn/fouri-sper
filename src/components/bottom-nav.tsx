"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto bg-sidebar px-1 pb-[calc(6px+env(safe-area-inset-bottom))] pt-1.5 md:hidden">
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-w-14 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 ${
              active ? "text-white" : "text-[#7d9584]"
            }`}
          >
            <item.Icon />
            <span className="text-[9px] font-bold">{item.kort}</span>
          </Link>
        );
      })}
    </nav>
  );
}
