import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GOOGLE_CALENDAR_SCOPE } from "@/lib/auth/google";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const session = data.session;

      // Present only when the OAuth flow requested the Calendar scope
      // (signInWithGoogle / connectGoogleCalendar in lib/auth/actions.ts).
      if (session?.provider_token && session.provider_refresh_token) {
        await supabase.from("calendar_connections").upsert({
          user_id: session.user.id,
          provider: "google",
          refresh_token: session.provider_refresh_token,
          scope: GOOGLE_CALENDAR_SCOPE,
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
