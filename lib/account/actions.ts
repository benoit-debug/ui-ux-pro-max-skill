"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GDPR: permanently delete the account and all associated data. Removing the
// auth.users row cascades (ON DELETE CASCADE) to profiles, daily_checkins,
// calendar_connections, calendar_data, daily_scores, group memberships, and
// any groups the user owns (and their invites).
export async function deleteAccount(formData: FormData) {
  if (formData.get("confirm") !== "on") {
    redirect(`/account?error=${encodeURIComponent("Please confirm before deleting")}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    redirect(`/account?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.auth.signOut();
  redirect("/login");
}
