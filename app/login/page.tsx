import { AuthForm } from "@/components/auth-form";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; notice?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, notice } = await searchParams;
  const message =
    error === "configuration"
      ? "Add your Supabase project URL and publishable key to .env.local before signing in."
      : notice === "signed-out"
        ? "You have been signed out."
        : error === "confirmation"
          ? "That confirmation link could not be used. Request a new link by registering again."
          : undefined;

  return <AuthForm mode="sign-in" notice={message} />;
}
