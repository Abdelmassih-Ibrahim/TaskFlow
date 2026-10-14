import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/shared";

const publicPaths = new Set(["/login", "/register", "/auth/callback"]);
const cacheHeaders = ["cache-control", "expires", "pragma"];

function copyAuthCookiesAndHeaders(
  destination: NextResponse,
  source: NextResponse,
) {
  for (const cookie of source.cookies.getAll()) {
    destination.cookies.set(cookie);
  }

  for (const header of cacheHeaders) {
    const value = source.headers.get(header);
    if (value) destination.headers.set(header, value);
  }

  return destination;
}

function redirectWithAuthState(
  url: URL,
  response: NextResponse,
): NextResponse {
  return copyAuthCookiesAndHeaders(NextResponse.redirect(url), response);
}

export async function proxy(request: NextRequest) {
  const isPublicPath = publicPaths.has(request.nextUrl.pathname);
  const config = getSupabaseConfig();

  if (!config) {
    if (isPublicPath) return NextResponse.next({ request });

    return NextResponse.redirect(
      new URL("/login?error=configuration", request.url),
    );
  }

  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });

        for (const [name, value] of Object.entries(headers)) {
          supabaseResponse.headers.set(name, value);
        }
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const isAuthenticated = !error && Boolean(data?.claims?.sub);
  const pathname = request.nextUrl.pathname;

  if (!isAuthenticated && !isPublicPath) {
    return redirectWithAuthState(
      new URL("/login", request.url),
      supabaseResponse,
    );
  }

  if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
    return redirectWithAuthState(new URL("/", request.url), supabaseResponse);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
