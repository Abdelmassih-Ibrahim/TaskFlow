import { z } from "zod";

export type SupabaseConfig = {
  url: string;
  publishableKey: string;
};

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) return null;

  const parsedUrl = z.string().url().safeParse(url);
  if (!parsedUrl.success) return null;

  const supabaseUrl = new URL(parsedUrl.data);
  const isSecure = supabaseUrl.protocol === "https:";
  const isLocalHttp =
    supabaseUrl.protocol === "http:" &&
    (supabaseUrl.hostname === "localhost" ||
      supabaseUrl.hostname === "127.0.0.1");

  if (!isSecure && !isLocalHttp) {
    return null;
  }

  return { url: supabaseUrl.origin, publishableKey };
}
