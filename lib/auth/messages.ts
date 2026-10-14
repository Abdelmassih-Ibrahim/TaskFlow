type AuthIntent = "sign-in" | "sign-up";

export function getAuthErrorMessage(
  code: string | undefined,
  intent: AuthIntent,
): string {
  if (code === "invalid_credentials") {
    return "E-postadressen eller lösenordet är felaktigt.";
  }

  if (code === "email_not_confirmed") {
    return "Bekräfta din e-postadress innan du loggar in.";
  }

  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit"
  ) {
    return "För många försök. Vänta en stund och försök igen.";
  }

  return intent === "sign-up"
    ? "Det gick inte att skapa ditt konto. Kontrollera uppgifterna och försök igen."
    : "Det gick inte att logga in just nu. Försök igen.";
}
