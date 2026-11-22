import { NextResponse, type NextRequest } from "next/server";
import { AUTH_UNAVAILABLE_MESSAGE } from "@/lib/auth-messages";
import { getSiteUrl, isSupabaseConfigured, logMissingSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    logMissingSupabaseConfig();
    return new Response(AUTH_UNAVAILABLE_MESSAGE, { status: 503 });
  }
  const code = request.nextUrl.searchParams.get("code");
  const siteUrl = getSiteUrl();
  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const path = request.nextUrl.searchParams.get("flow") === "recovery" ? "/redefinir-senha" : "/";
      return NextResponse.redirect(new URL(path, siteUrl));
    }
  }
  return NextResponse.redirect(new URL("/login?erro=link", siteUrl));
}
