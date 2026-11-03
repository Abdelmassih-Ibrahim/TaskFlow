import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AcceptResult =
  | { ok: true; projectId: string }
  | { ok: false; message: string };

async function acceptInvitation(token: string): Promise<AcceptResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: "Tjänsten är inte tillgänglig just nu." };
  }

  const { data, error } = await supabase.rpc("accept_invitation", { p_token: token });
  if (error || !data) {
    return { ok: false, message: error?.message ?? "Inbjudan kunde inte accepteras." };
  }

  return { ok: true, projectId: data };
}

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await acceptInvitation(token);

  return (
    <main className="min-w-0 flex-1 px-5 pb-12 pt-7 sm:px-8 lg:ml-[248px] lg:px-10 lg:pt-10">
      <div className="mx-auto max-w-[560px]">
        {result.ok ? (
          <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
            <h1 className="text-lg font-semibold text-emerald-900">Du är med i projektet</h1>
            <p className="mt-1 text-sm text-emerald-800">
              Din inbjudan är accepterad. Du kan nu se projektets uppgifter.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/?projekt=${result.projectId}#task-overview`}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Öppna projektet
              </Link>
              <Link
                href="/"
                className="rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
              >
                Till översikten
              </Link>
            </div>
          </section>
        ) : (
          <section role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-6">
            <h1 className="text-lg font-semibold text-rose-900">Inbjudan kunde inte accepteras</h1>
            <p className="mt-1 text-sm text-rose-800">{result.message}</p>
            <Link href="/" className="mt-5 inline-block text-sm font-semibold text-rose-900 underline">
              Till översikten
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
