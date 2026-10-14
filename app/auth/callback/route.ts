import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.redirect(
      new URL("/login?error=configuration", requestUrl),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=confirmation", requestUrl),
    );
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=confirmation", requestUrl),
    );
  }

  return NextResponse.redirect(new URL("/", requestUrl));
}
