"use client";

import { useActionState } from "react";
import { deleteAccount } from "@/app/actions/account";
import { initialAuthActionState } from "@/lib/auth/action-state";

export function DeleteAccountForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(
    deleteAccount,
    initialAuthActionState,
  );
  const inputClass =
    "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600";

  return (
    <form action={formAction} className="mt-5 space-y-4" noValidate>
      {state.status === "error" && state.message ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.message}
        </p>
      ) : null}

      <div>
        <label htmlFor="delete-email" className="text-sm font-medium text-slate-800">
          Skriv din e-postadress ({email}) för att bekräfta
        </label>
        <input
          id="delete-email"
          name="email"
          type="email"
          autoComplete="off"
          required
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby={state.fieldErrors?.email ? "delete-email-error" : undefined}
          className={inputClass}
        />
        {state.fieldErrors?.email ? (
          <p id="delete-email-error" className="mt-1 text-sm text-red-700">
            {state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="delete-password" className="text-sm font-medium text-slate-800">
          Lösenord
        </label>
        <input
          id="delete-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(state.fieldErrors?.password)}
          aria-describedby={state.fieldErrors?.password ? "delete-password-error" : undefined}
          className={inputClass}
        />
        {state.fieldErrors?.password ? (
          <p id="delete-password-error" className="mt-1 text-sm text-red-700">
            {state.fieldErrors.password}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Raderar..." : "Radera mitt konto permanent"}
      </button>
    </form>
  );
}
