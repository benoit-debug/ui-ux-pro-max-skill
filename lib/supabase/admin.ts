import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client for privileged operations that RLS deliberately blocks
// for end users (currently: deleting an auth user, which cascades all of
// their data). NEVER import this from a Client Component - the service role
// key must stay server-side only.
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
