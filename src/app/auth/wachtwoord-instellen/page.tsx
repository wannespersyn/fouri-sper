import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WachtwoordForm } from "@/app/auth/wachtwoord-instellen/wachtwoord-form";

export default async function WachtwoordInstellenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-5.5">
      <div className="w-full max-w-sm rounded-2xl border border-card-border bg-card p-7">
        <div className="mb-6 flex flex-col items-center gap-2.75 text-center">
          <div className="flex size-9.5 items-center justify-center rounded-[11px] bg-accent font-head text-xl font-extrabold text-white">
            F
          </div>
          <div>
            <div className="font-head text-lg font-extrabold tracking-tight">
              Welkom bij Fouri SPER
            </div>
            <div className="text-[11px] font-semibold text-[#8a8172]">
              Stel je wachtwoord in om te starten
            </div>
          </div>
        </div>
        <WachtwoordForm />
      </div>
    </div>
  );
}
