"use client";

import { useActionState } from "react";
import { ArrowRight, Command, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { signIn, signUp } from "@/app/actions/auth";
import {
  initialAuthActionState,
  type AuthActionState,
} from "@/lib/auth/action-state";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
  notice?: string;
  noticeIsError?: boolean;
};

const inputClassName =
  "mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 shadow-sm placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20";

function AuthFeedback({
  state,
  notice,
  noticeIsError = false,
}: {
  state: AuthActionState;
  notice?: string;
  noticeIsError?: boolean;
}) {
  if (state.status === "idle" && !notice) return null;

  const isError =
    state.status === "error" || (state.status === "idle" && noticeIsError);
  const message = state.status === "idle" ? notice : state.message;

  return (
    <p
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={`mb-5 rounded-lg border px-3.5 py-3 text-sm leading-5 ${
        isError
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-teal-200 bg-teal-50 text-teal-900"
      }`}
    >
      {message}
    </p>
  );
}

export function AuthForm({
  mode,
  notice,
  noticeIsError,
}: AuthFormProps) {
  const action = mode === "sign-in" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(
    action,
    initialAuthActionState,
  );
  const isSignUp = mode === "sign-up";
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-4 py-10 sm:px-6">
      <div className="w-full max-w-[440px]">
        <Link
          href="/login"
          className="mb-7 inline-flex items-center gap-2.5 rounded-md text-slate-900"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-teal-400 text-slate-950 shadow-sm">
            <Command size={19} strokeWidth={2.6} aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            taskflow<span className="text-teal-600">.</span>
          </span>
        </Link>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.35)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
            Your focused workspace
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {isSignUp
              ? "Sign up to continue to TaskFlow."
              : "Sign in to continue to your TaskFlow workspace."}
          </p>

          <div className="mt-6">
            <AuthFeedback
              state={state}
              notice={notice}
              noticeIsError={noticeIsError}
            />
          </div>

          <form action={formAction} aria-busy={pending} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-800"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                maxLength={254}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                className={inputClassName}
              />
              {fieldErrors.email && (
                <p id="email-error" className="mt-1.5 text-sm text-rose-700">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-800"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                minLength={8}
                maxLength={72}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={
                  fieldErrors.password ? "password-error" : undefined
                }
                className={inputClassName}
              />
              {fieldErrors.password && (
                <p id="password-error" className="mt-1.5 text-sm text-rose-700">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {isSignUp && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-slate-800"
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={72}
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                  aria-describedby={
                    fieldErrors.confirmPassword
                      ? "confirm-password-error"
                      : undefined
                  }
                  className={inputClassName}
                />
                {fieldErrors.confirmPassword && (
                  <p
                    id="confirm-password-error"
                    className="mt-1.5 text-sm text-rose-700"
                  >
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-500"
            >
              {pending ? (
                <>
                  <LoaderCircle size={16} aria-hidden="true" className="animate-spin" />
                  {isSignUp ? "Creating account..." : "Signing in..."}
                </>
              ) : (
                <>
                  {isSignUp ? "Create account" : "Sign in"}
                  <ArrowRight size={16} aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            {isSignUp ? "Already have an account?" : "New to TaskFlow?"}{" "}
            <Link
              href={isSignUp ? "/login" : "/register"}
              className="font-semibold text-teal-800 underline decoration-teal-300 underline-offset-4 hover:text-teal-950"
            >
              {isSignUp ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </section>
        <p className="mt-5 text-center text-xs leading-5 text-slate-500">
          TaskFlow uses Supabase Auth to manage your sign-in session. Your
          password is never stored by this application.
        </p>
      </div>
    </main>
  );
}
