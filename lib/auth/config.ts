import { z } from "zod";
import { getSupabaseConfig } from "../supabase/shared";

export function getAuthSiteUrl(): string | null {
  const isVercelPreview = process.env.VERCEL_ENV === "preview";
  const configuredSiteUrl = isVercelPreview
    ? process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined
    : process.env.NEXT_PUBLIC_SITE_URL;
  const parsed = z.string().url().safeParse(configuredSiteUrl);
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
    return "Lägg till Supabase-projektets URL och publishable key i .env.local innan du använder autentiseringen.";
  }

  if (registration && !getAuthSiteUrl()) {
    return "Registreringen kräver en giltig appadress. Ange NEXT_PUBLIC_SITE_URL eller aktivera Vercels systemvariabler för Preview-driftsättningar.";
  }

  return null;
}
