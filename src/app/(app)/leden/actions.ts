"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { formString } from "@/lib/form";

export type InviteState = { error: string | null; success: string | null };

export async function inviteLid(
  _prevState: InviteState,
  formData: FormData
): Promise<InviteState> {
  const email = formString(formData, "email").trim();
  if (!email) return { error: "Vul een e-mailadres in.", success: null };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email);

  if (error) {
    return { error: `Uitnodigen mislukt: ${error.message}`, success: null };
  }

  revalidatePath("/leden");
  return { error: null, success: `Uitnodiging verstuurd naar ${email}.` };
}
