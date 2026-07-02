"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createGroup(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    redirect(`/groups?error=${encodeURIComponent("Group name is required")}`);
  }

  const { data, error } = await supabase
    .from("groups")
    .insert({ name, owner_id: user.id })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/groups?error=${encodeURIComponent(error?.message ?? "Failed to create group")}`);
  }

  redirect(`/groups/${data.id}`);
}

export async function createInviteLink(formData: FormData) {
  const { supabase, user } = await requireUser();
  const groupId = String(formData.get("group_id") ?? "");

  const { error } = await supabase
    .from("group_invites")
    .insert({ group_id: groupId, created_by: user.id });

  if (error) {
    redirect(`/groups/${groupId}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath(`/groups/${groupId}`);
}

export async function toggleRanking(formData: FormData) {
  const { supabase, user } = await requireUser();
  const groupId = String(formData.get("group_id") ?? "");
  const participate = formData.get("participate") === "true";

  const { error } = await supabase
    .from("group_members")
    .update({ participates_in_ranking: participate })
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  if (error) {
    redirect(`/groups/${groupId}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath(`/groups/${groupId}`);
}

export async function leaveGroup(formData: FormData) {
  const { supabase, user } = await requireUser();
  const groupId = String(formData.get("group_id") ?? "");

  await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  redirect("/groups");
}

export async function joinGroup(formData: FormData) {
  const { supabase } = await requireUser();
  const token = String(formData.get("token") ?? "");

  const { data, error } = await supabase.rpc("join_group_with_token", {
    p_token: token,
  });

  if (error || !data) {
    redirect(`/join/${token}?error=${encodeURIComponent(error?.message ?? "Could not join group")}`);
  }

  redirect(`/groups/${data}`);
}
