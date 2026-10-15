"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { AuthActionState } from "@/lib/auth/action-state";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const deleteAccountSchema = z.object({
  email: z.string().trim().min(1, "Skriv din e-postadress för att bekräfta."),
  password: z.string().min(1, "Ange ditt lösenord."),
});

function readString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function deleteAccount(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = deleteAccountSchema.safeParse({
    email: readString(formData, "email"),
    password: readString(formData, "password"),
  });

  if (!parsed.success) {
    const fieldErrors: NonNullable<AuthActionState["fieldErrors"]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if ((field === "email" || field === "password") && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      status: "error",
      message: "Kontrollera fälten nedan och försök igen.",
      fieldErrors,
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { status: "error", message: "Autentisering är inte konfigurerad." };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    redirect("/login");
  }

  if (parsed.data.email.toLowerCase() !== user.email.toLowerCase()) {
    return {
      status: "error",
      message: "Kontrollera fälten nedan och försök igen.",
      fieldErrors: { email: "E-postadressen matchar inte ditt konto." },
    };
  }

  // Re-authenticate so a hijacked session alone cannot delete the account.
  const { error: passwordError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.password,
  });

  if (passwordError) {
    return {
      status: "error",
      message: "Kontrollera fälten nedan och försök igen.",
      fieldErrors: { password: "Lösenordet är fel." },
    };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return {
      status: "error",
      message:
        "Kontoradering är inte konfigurerad i den här miljön. Kontakta den som driftar tjänsten.",
    };
  }

  // The id always comes from the verified session, never from the client.
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return {
      status: "error",
      message: "Kontot kunde inte raderas. Försök igen senare.",
    };
  }

  await supabase.auth.signOut({ scope: "local" });
  redirect("/login?notice=account-deleted");
}
