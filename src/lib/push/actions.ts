"use server";

import { createClient } from "@/lib/supabase/server";
import { formString } from "@/lib/form";

export async function opslaanPushSubscriptie(subscriptie: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("push_subscription").upsert(
    {
      gebruiker_id: user.id,
      endpoint: subscriptie.endpoint,
      p256dh: subscriptie.keys.p256dh,
      auth: subscriptie.keys.auth,
    },
    { onConflict: "endpoint" }
  );
}

export async function verwijderPushSubscriptie(formData: FormData) {
  const endpoint = formString(formData, "endpoint");
  if (!endpoint) return;

  const supabase = await createClient();
  await supabase.from("push_subscription").delete().eq("endpoint", endpoint);
}
