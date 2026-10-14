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
      ? "You have been signed out."
      : error === "confirmation"
        ? "That confirmation link could not be used. Request a new link by registering again."
        : undefined);

  return (
    <AuthForm
      mode="sign-in"
      notice={message}
      noticeIsError={Boolean(setupMessage || error === "configuration" || error === "confirmation")}
    />
  );
}
