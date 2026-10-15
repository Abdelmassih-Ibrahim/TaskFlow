import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";

describe("säkerhetsheaders", () => {
  it("sätts på alla routes", async () => {
    const rules = (await nextConfig.headers?.()) ?? [];
    const rule = rules.find((entry) => entry.source === "/:path*");
    const headers = Object.fromEntries(
      (rule?.headers ?? []).map(({ key, value }) => [key, value]),
    );

    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Permissions-Policy"]).toContain("camera=()");
  });
});
