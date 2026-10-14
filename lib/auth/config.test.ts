import { afterEach, describe, expect, it, vi } from "vitest";
import { getAuthSetupMessage, getAuthSiteUrl } from "./config";
import { getSupabaseConfig } from "../supabase/shared";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Supabase auth configuration", () => {
  it("reports missing public Supabase values", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    expect(getAuthSetupMessage()).toContain("Supabase project URL");
    expect(getSupabaseConfig()).toBeNull();
  });

  it("accepts local Supabase URLs and the local app origin", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-placeholder");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("VERCEL_URL", "");

    expect(getSupabaseConfig()?.url).toBe("http://127.0.0.1:54321");
    expect(getAuthSiteUrl()).toBe("http://localhost:3000");
    expect(getAuthSetupMessage({ registration: true })).toBeNull();
  });

  it("uses the current Vercel Preview deployment host for confirmation links", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://production.example.com");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "taskflow-preview.vercel.app");

    expect(getAuthSiteUrl()).toBe("https://taskflow-preview.vercel.app");
  });

  it("does not fall back to the production origin when the preview host is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-placeholder");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://production.example.com");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "");

    expect(getAuthSiteUrl()).toBeNull();
    expect(getAuthSetupMessage({ registration: true })).toContain(
      "Vercel system environment variables",
    );
  });

  it("rejects non-local insecure service URLs and requires a site URL for registration", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://example.com");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-placeholder");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");

    expect(getSupabaseConfig()).toBeNull();
    expect(getAuthSetupMessage()).toContain("Supabase project URL");

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    expect(getAuthSetupMessage({ registration: true })).toContain(
      "NEXT_PUBLIC_SITE_URL",
    );
  });

  it("does not accept insecure non-HTTP site URLs, even on localhost", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-placeholder");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "ftp://localhost:3000");

    expect(getAuthSiteUrl()).toBeNull();
    expect(getAuthSetupMessage({ registration: true })).toContain(
      "NEXT_PUBLIC_SITE_URL",
    );
  });
});
