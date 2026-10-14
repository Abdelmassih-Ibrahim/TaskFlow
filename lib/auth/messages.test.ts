import { describe, expect, it } from "vitest";
import { getAuthErrorMessage } from "./messages";

describe("authentication error messages", () => {
  it("uses a non-specific message for incorrect credentials", () => {
    expect(getAuthErrorMessage("invalid_credentials", "sign-in")).toBe(
      "The email address or password is incorrect.",
    );
  });

  it("asks unconfirmed users to verify their email", () => {
    expect(getAuthErrorMessage("email_not_confirmed", "sign-in")).toBe(
      "Confirm your email address before signing in.",
    );
  });

  it("does not expose unknown Supabase error details", () => {
    expect(getAuthErrorMessage("internal_server_error", "sign-up")).toBe(
      "We couldn't create your account. Check your details and try again.",
    );
  });
});
