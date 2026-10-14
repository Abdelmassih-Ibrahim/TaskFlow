"use server";

import { redirect } from "next/navigation";
import { getAuthErrorMessage } from "@/lib/auth/messages";
import {
  signInSchema,
  signUpSchema,
  type AuthFieldErrors,
} from "@/lib/auth/validation";
import type { AuthActionState } from "@/lib/auth/action-state";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getFieldErrors(
  issues: { path: PropertyKey[]; message: string }[],
): AuthFieldErrors {
  const fieldErrors: AuthFieldErrors = {};

  for (const issue of issues) {
    const field = issue.path[0];

    if (
      (field === "email" ||
        field === "password" ||
        field === "confirmPassword") &&
      !fieldErrors[field]
    ) {
      fieldErrors[field] = issue.message;
    }
  }

  return fieldErrors;
}

function readFormData(formData: FormData) {
  return {
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };
}

function getSiteUrl(): string | null {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) return null;

  const parsedSiteUrl = new URL(siteUrl);
  if (
    parsedSiteUrl.protocol !== "https:" &&
    parsedSiteUrl.hostname !== "localhost" &&
    parsedSiteUrl.hostname !== "127.0.0.1"
  ) {
    return null;
  }

  return parsedSiteUrl.origin;
}

export async function signIn(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse(readFormData(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the fields below and try again.",
      fieldErrors: getFieldErrors(parsed.error.issues),
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Authentication is not configured. Add the Supabase values to .env.local.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      status: "error",
      message: getAuthErrorMessage(error.code, "sign-in"),
    };
  }

  redirect("/");
}

export async function signUp(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse(readFormData(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the fields below and try again.",
      fieldErrors: getFieldErrors(parsed.error.issues),
    };
  }

  const siteUrl = getSiteUrl();

  if (!siteUrl) {
    return {
      status: "error",
      message:
        "Registration needs a valid NEXT_PUBLIC_SITE_URL in .env.local to configure the confirmation link.",
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Authentication is not configured. Add the Supabase values to .env.local.",
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: new URL("/auth/callback", siteUrl).toString(),
    },
  });

  if (error) {
    return {
      status: "error",
      message: getAuthErrorMessage(error.code, "sign-up"),
    };
  }

  if (data.session) {
    redirect("/");
  }

  return {
    status: "success",
    message: "Check your email for a confirmation link to finish creating your account.",
  };
}

export async function signOut(_formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/login?error=configuration");
  }

  const { error } = await supabase.auth.signOut({ scope: "local" });

  if (error) {
    redirect("/?error=sign-out");
  }

  redirect("/login?notice=signed-out");
}
