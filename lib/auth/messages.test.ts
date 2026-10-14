import { describe, expect, it } from "vitest";
import { getAuthErrorMessage } from "./messages";

describe("authentication error messages", () => {
  it("uses a non-specific message for incorrect credentials", () => {
    expect(getAuthErrorMessage("invalid_credentials", "sign-in")).toBe(
      "E-postadressen eller lösenordet är felaktigt.",
    );
  });

  it("asks unconfirmed users to verify their email", () => {
    expect(getAuthErrorMessage("email_not_confirmed", "sign-in")).toBe(
      "Bekräfta din e-postadress innan du loggar in.",
    );
  });

  it("does not expose unknown Supabase error details", () => {
    expect(getAuthErrorMessage("internal_server_error", "sign-up")).toBe(
      "Det gick inte att skapa ditt konto. Kontrollera uppgifterna och försök igen.",
    );
  });
});
