import { z } from "zod";
import { getSupabaseConfig } from "../supabase/shared";

export function getAuthSiteUrl(): string | null {
  const parsed = z.string().url().safeParse(process.env.NEXT_PUBLIC_SITE_URL);
  if (!parsed.success) return null;

  const siteUrl = new URL(parsed.data);
  const isSecure = siteUrl.protocol === "https:";
  const isLocalHttp =
    siteUrl.protocol === "http:" &&
    (siteUrl.hostname === "localhost" || siteUrl.hostname === "127.0.0.1");

  if (!isSecure && !isLocalHttp) {
    return null;
  }

  return siteUrl.origin;
}

export function getAuthSetupMessage({
  registration = false,
}: {
  registration?: boolean;
} = {}): string | null {
  if (!getSupabaseConfig()) {
    return "Add your Supabase project URL and publishable key to .env.local before using authentication.";
  }

  if (registration && !getAuthSiteUrl()) {
    return "Registration needs a valid NEXT_PUBLIC_SITE_URL in .env.local to configure the confirmation link.";
  }

  return null;
}
