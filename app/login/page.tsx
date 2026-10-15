import { AuthForm } from "@/components/auth-form";
import { getAuthSetupMessage } from "@/lib/auth/config";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; notice?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, notice } = await searchParams;
  const setupMessage = getAuthSetupMessage();
  const message =
    setupMessage ??
    (notice === "signed-out"
      ? "Du har loggat ut."
      : notice === "account-deleted"
        ? "Ditt konto och dina data har raderats."
        : error === "confirmation"
        ? "Bekräftelselänken kunde inte användas. Registrera dig igen för att få en ny länk."
        : undefined);

  return (
    <AuthForm
      mode="sign-in"
      notice={message}
      noticeIsError={Boolean(setupMessage || error === "configuration" || error === "confirmation")}
    />
  );
}
