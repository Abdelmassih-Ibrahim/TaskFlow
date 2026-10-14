import { AuthForm } from "@/components/auth-form";
import { getAuthSetupMessage } from "@/lib/auth/config";

type RegisterPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const { error } = await searchParams;
  const notice =
    getAuthSetupMessage({ registration: true }) ??
    (error === "configuration"
      ? "Add your Supabase project URL and publishable key to .env.local before creating an account."
      : undefined);

  return (
    <AuthForm
      mode="sign-up"
      notice={notice}
      noticeIsError={Boolean(notice)}
    />
  );
}
