import { AuthForm } from "@/components/auth-form";

type RegisterPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const { error } = await searchParams;
  const notice =
    error === "configuration"
      ? "Add your Supabase project URL and publishable key to .env.local before creating an account."
      : undefined;

  return <AuthForm mode="sign-up" notice={notice} />;
}
