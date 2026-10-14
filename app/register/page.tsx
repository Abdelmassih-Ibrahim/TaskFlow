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
      ? "Lägg till Supabase-projektets URL och publishable key i .env.local innan du skapar ett konto."
      : undefined);

  return (
    <AuthForm
      mode="sign-up"
      notice={notice}
      noticeIsError={Boolean(notice)}
    />
  );
}
