import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppNavigation } from "@/components/app-navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/login?error=configuration");
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <>
      <AppNavigation email={user.email ?? "Inloggat konto"} />
      {children}
    </>
  );
}
