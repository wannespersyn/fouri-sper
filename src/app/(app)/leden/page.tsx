import { PageHeader } from "@/components/page-header";
import { createAdminClient } from "@/lib/supabase/admin";
import { NieuwLidForm } from "@/app/(app)/leden/nieuw-lid-form";

export default async function LedenPage() {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers();
  const leden = error ? [] : data.users;

  return (
    <>
      <PageHeader title="Leden" subtitle="Wie heeft toegang tot Fouri SPER" />
      <div className="flex-1 overflow-auto p-3.5 sm:p-5.5">
        <div className="mx-auto flex max-w-295 flex-col gap-3.5">
          <NieuwLidForm />

          {leden.length === 0 && (
            <p className="text-sm text-[#6f7d72]">Nog geen leden.</p>
          )}

          {leden.map((lid) => (
            <div
              key={lid.id}
              className="flex items-center justify-between rounded-[15px] border border-card-border bg-card p-4.5"
            >
              <div className="text-sm font-bold">{lid.email}</div>
              <div className="text-xs text-[#6f7d72]">
                {lid.last_sign_in_at
                  ? `Laatst ingelogd op ${new Date(lid.last_sign_in_at).toLocaleDateString("nl-BE")}`
                  : "Uitgenodigd — nog niet geactiveerd"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
