"use server";

import { redirect } from "next/navigation";
import { getAuthSiteUrl, getAuthSetupMessage } from "@/lib/auth/config";
import { getAuthErrorMessage } from "@/lib/auth/messages";
import {
  signInSchema,
  signUpSchema,
} from "@/lib/auth/validation";
import type {
  AuthActionState,
  AuthFieldErrors,
} from "@/lib/auth/action-state";
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
  const readString = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };

  return {
    email: readString("email"),
    password: readString("password"),
    confirmPassword: readString("confirmPassword"),
  };
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

  const setupMessage = getAuthSetupMessage({ registration: true });

  if (setupMessage) {
    return {
      status: "error",
      message: setupMessage,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Authentication is not configured. Add the Supabase values to .env.local.",
    };
  }

  const siteUrl = getAuthSiteUrl();
  if (!siteUrl) {
    return {
      status: "error",
      message:
        "Registration needs a valid NEXT_PUBLIC_SITE_URL in .env.local to configure the confirmation link.",
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

export async function signOut(): Promise<void> {
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
