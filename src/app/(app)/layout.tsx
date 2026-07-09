import type { ReactNode } from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import { BottomNav } from "@/components/bottom-nav";
import { CreateKampForm } from "@/components/create-kamp-form";
import { getActiefKamp, formatDatumBereik } from "@/lib/data/kamp";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const kamp = await getActiefKamp();

  if (!kamp) {
    return <CreateKampForm />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className="hidden w-59 flex-none flex-col gap-1.5 bg-sidebar p-3.5 text-[#e9f0e9] md:flex">
        <div className="flex items-center gap-2.75 px-2 pt-1.5 pb-4.5">
          <div className="flex size-9.5 flex-none items-center justify-center rounded-[11px] bg-accent font-head text-xl font-extrabold text-white shadow-[0_2px_0_rgba(0,0,0,0.2)]">
            F
          </div>
          <div className="leading-tight whitespace-nowrap">
            <div className="font-head text-lg font-extrabold tracking-tight">Fouri SPER</div>
            <div className="text-[11px] font-semibold text-[#9db6a4]">kampplanner</div>
          </div>
        </div>

        <SidebarNav />

        <div className="mt-auto border-t border-white/10 px-2.5 pt-3 pb-0.5">
          <div className="text-[11px] font-semibold text-[#8fa997]">Kamp</div>
          <div className="mt-0.5 text-sm font-bold">{kamp.naam}</div>
          <div className="mt-0.5 text-xs text-[#9db6a4]">
            {formatDatumBereik(kamp.start_datum, kamp.eind_datum)}
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pb-14 md:pb-0">
        {children}
      </div>

      <BottomNav />
    </div>
  );
}
