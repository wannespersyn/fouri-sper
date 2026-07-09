"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1.5">
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
              active ? "bg-sidebar-2 text-white" : "text-[#c3d3c6] hover:bg-sidebar-2/60"
            }`}
          >
            <span className="flex w-5 justify-center">
              <item.Icon />
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
