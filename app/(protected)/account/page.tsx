import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteAccountForm } from "@/components/delete-account-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Konto – TaskFlow" };

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login?error=configuration");

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user?.email) redirect("/login");

  return (
    <main className="min-w-0 px-5 pb-12 pt-7 sm:px-8 lg:ml-[248px] lg:px-10 lg:pt-10">
      <div className="max-w-2xl">
        <Link href="/" className="text-sm font-medium text-teal-700 underline-offset-4 hover:underline">
          Tillbaka till översikten
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
          Konto
        </h1>
        <p className="mt-1 text-sm text-slate-600">Inloggad som {user.email}</p>

        <section aria-labelledby="delete-heading" className="mt-8 rounded-xl border border-red-200 bg-white p-6">
          <h2 id="delete-heading" className="text-lg font-semibold text-red-800">
            Radera konto
          </h2>
          <p className="mt-2 text-sm text-slate-700">
            Om du raderar kontot tas din inloggning och alla dina projekt och
            uppgifter bort permanent. Åtgärden kan inte ångras. Eventuella
            säkerhetskopior hos leverantören omfattas av deras lagringstider, som
            ännu inte är bekräftade.
          </p>
          <DeleteAccountForm email={user.email} />
        </section>
      </div>
    </main>
  );
}
