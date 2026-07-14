"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type WachtwoordState = { error: string | null };

export async function stelWachtwoordIn(
  _prevState: WachtwoordState,
  formData: FormData
): Promise<WachtwoordState> {
  const password = String(formData.get("password") ?? "");
  const passwordHerhaal = String(formData.get("password_herhaal") ?? "");

  if (password.length < 6) {
    return { error: "Wachtwoord moet minstens 6 tekens bevatten." };
  }
  if (password !== passwordHerhaal) {
    return { error: "Wachtwoorden komen niet overeen." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: "Instellen van wachtwoord mislukt — probeer opnieuw." };
  }

  redirect("/menuplanner");
}
