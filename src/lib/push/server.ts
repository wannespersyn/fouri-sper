import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export type PushPayload = { title: string; body: string; url?: string };

let vapidGeconfigureerd = false;

// Pas bij de eerste effectieve aanroep geconfigureerd i.p.v. op module-niveau
// — anders breekt een ontbrekende/foutieve VAPID-env-var (bv. dev-server niet
// herstart na het toevoegen ervan) elke server action die dit bestand
// importeert, ook actions die niets met push te maken hebben.
function zorgVoorVapidConfig() {
  if (vapidGeconfigureerd) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  vapidGeconfigureerd = true;
}

// Stuurt naar alle geabonneerde toestellen, optioneel één gebruiker
// overslaan (degene die de oproep zelf start hoeft 'm niet te ontvangen).
// Gebruikt de admin-client omdat dit de abonnementen van andere gebruikers
// moet lezen — RLS op push_subscription staat dat terecht niet toe voor het
// gewone authenticated-account.
export async function stuurPushNaarAllen(payload: PushPayload, exclGebruikerId?: string) {
  zorgVoorVapidConfig();
  const supabase = createAdminClient();
  let query = supabase.from("push_subscription").select("id, gebruiker_id, endpoint, p256dh, auth");
  if (exclGebruikerId) query = query.neq("gebruiker_id", exclGebruikerId);
  const { data: subscripties } = await query;
  if (!subscripties || subscripties.length === 0) return;

  const verlopenIds: string[] = [];

  await Promise.all(
    subscripties.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) verlopenIds.push(sub.id);
      }
    })
  );

  if (verlopenIds.length > 0) {
    await supabase.from("push_subscription").delete().in("id", verlopenIds);
  }
}
