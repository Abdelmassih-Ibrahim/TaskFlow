type AuthIntent = "sign-in" | "sign-up";

export function getAuthErrorMessage(
  code: string | undefined,
  intent: AuthIntent,
): string {
  if (code === "invalid_credentials") {
    return "The email address or password is incorrect.";
  }

  if (code === "email_not_confirmed") {
    return "Confirm your email address before signing in.";
  }

  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit"
  ) {
    return "Too many attempts. Wait a little while, then try again.";
  }

  return intent === "sign-up"
    ? "We couldn't create your account. Check your details and try again."
    : "We couldn't sign you in right now. Please try again.";
}
