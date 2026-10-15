"use client";

import {
  BarChart3,
  CalendarDays,
  CheckSquare2,
  CircleHelp,
  Command,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { signOut } from "@/app/actions/auth";

async function submitSignOut(): Promise<null> {
  await signOut();
  return null;
}

const primaryNavigation = [
  { label: "Översikt", href: "#dashboard", icon: LayoutDashboard, active: true },
  { label: "Mina uppgifter", href: "#task-overview", icon: CheckSquare2, active: false },
  { label: "Projekt", href: "#projects", icon: FolderKanban, active: false },
];

const secondaryNavigation = [
  { label: "Rapporter", href: "/reports", icon: BarChart3 },
  { label: "Kalender", href: "/calendar", icon: CalendarDays },
];

const unavailableNavigation = [];

function SidebarContent({
  email,
  onNavigate,
}: {
  email: string;
  onNavigate?: () => void;
}) {
  const [, signOutAction, signingOut] = useActionState(submitSignOut, null);

  return (
    <>
      <div className="flex h-[76px] items-center gap-3 px-6">
        <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-950/20">
          <Command size={19} strokeWidth={2.6} aria-hidden="true" />
        </span>
        <span className="text-[17px] font-semibold tracking-tight text-white">
          taskflow<span className="text-indigo-300">.</span>
        </span>
      </div>

      <div className="mx-4 mb-6 rounded-xl border border-white/10 bg-white/[0.06] p-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-400/20 text-xs font-semibold text-indigo-200">
            {email.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-100">
              {email}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Personlig arbetsyta
            </p>
          </div>
        </div>
      </div>

      <nav aria-label="Huvudnavigering" className="flex-1 px-3">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Arbetsyta
        </p>
        <ul className="space-y-1">
          {primaryNavigation.map(({ label, href, icon: Icon, active }) => (
            <li key={label}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-100"
                }`}
              >
                <Icon
                  size={17}
                  aria-hidden="true"
                  className={active ? "text-indigo-300" : "text-slate-500"}
                />
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <p className="mb-2 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Organisera
        </p>
        <ul className="space-y-1">
          {secondaryNavigation.map(({ label, href, icon: Icon }) => (
            <li key={label}>
              <Link
                href={href}
                onClick={onNavigate}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-slate-100"
              >
                <Icon size={17} aria-hidden="true" className="text-slate-500" />
                {label}
              </Link>
            </li>
          ))}
          {unavailableNavigation.map(({ label, icon: Icon }) => (
            <li key={label}>
              <span
                aria-disabled="true"
                title={`${label} är inte tillgängligt ännu`}
                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-500"
              >
                <Icon size={17} aria-hidden="true" className="text-slate-600" />
                {label}
                <span className="ml-auto text-[9px] font-semibold uppercase tracking-wide text-slate-600">
                  Snart
                </span>
              </span>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-1 border-t border-white/[0.08] px-3 py-4">
        <Link
          href="/account"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <Settings2 size={16} aria-hidden="true" className="text-slate-500" />
          Konto
        </Link>
        <span
          aria-disabled="true"
          title="Hjälp är inte tillgänglig ännu"
          className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-slate-500"
        >
          <CircleHelp size={16} aria-hidden="true" className="text-slate-600" />
          Hjälp och support
        </span>
        <div className="mt-3 flex items-center gap-3 border-t border-white/[0.08] px-3 pt-4">
          <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-orange-300 text-[11px] font-bold text-orange-950">
            {email.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-slate-200">{email}</p>
            <p className="truncate text-[10px] text-slate-500">Inloggad</p>
          </div>
        </div>
        <form action={signOutAction} className="mt-2">
          <button
            type="submit"
            disabled={signingOut}
            onClick={onNavigate}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-wait disabled:opacity-60"
          >
            <LogOut size={16} aria-hidden="true" className="text-slate-500" />
            {signingOut ? "Loggar ut..." : "Logga ut"}
          </button>
        </form>
      </div>
    </>
  );
}

export function AppNavigation({ email }: { email: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavigationRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;

    const navigation = mobileNavigationRef.current;
    const focusableElements = navigation?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements?.item(0);
    const lastElement = focusableElements?.item(
      (focusableElements.length ?? 1) - 1,
    );

    firstElement?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !firstElement || !lastElement) return;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  function closeMobileNavigation() {
    setMobileOpen(false);
    menuButtonRef.current?.focus();
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col bg-[#111827] lg:flex">
        <SidebarContent email={email} />
        <div className="mx-4 mb-4 flex items-center gap-2 rounded-lg bg-indigo-600/[0.08] px-3 py-2.5 text-[11px] text-indigo-100/80">
          <Sparkles size={14} aria-hidden="true" className="text-indigo-400" />
          En lugn plats för fokuserat arbete
        </div>
      </aside>

      <div className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur lg:hidden">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Öppna navigeringsmenyn"
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          className="inline-flex size-10 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-offset-2"
        >
          <Menu size={21} aria-hidden="true" />
        </button>
        <Link
          href="#dashboard"
          className="flex items-center gap-2 text-[16px] font-semibold tracking-tight text-slate-900"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Command size={15} strokeWidth={2.6} aria-hidden="true" />
          </span>
          taskflow<span className="-ml-2 text-indigo-600">.</span>
        </Link>
        <span aria-hidden="true" className="size-10" />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Stäng navigeringsmenyn"
            onClick={closeMobileNavigation}
            className="absolute inset-0 cursor-default bg-slate-950/50"
          />
          <aside
            id="mobile-navigation"
            ref={mobileNavigationRef}
            role="dialog"
            aria-modal="true"
            aria-label="Mobilnavigering"
            className="absolute inset-y-0 left-0 flex w-[min(300px,86vw)] flex-col bg-[#111827] shadow-2xl"
          >
            <div className="absolute right-3 top-5 z-10">
              <button
                type="button"
                onClick={closeMobileNavigation}
                aria-label="Stäng navigeringsmenyn"
                className="inline-flex size-9 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <X size={19} aria-hidden="true" />
              </button>
            </div>
            <SidebarContent email={email} onNavigate={closeMobileNavigation} />
            <div className="mx-4 mb-4 flex items-center gap-2 rounded-lg bg-teal-400/[0.08] px-3 py-2.5 text-[11px] text-teal-100/80">
              <Sparkles size={14} aria-hidden="true" className="text-teal-300" />
              En lugn plats för fokuserat arbete
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
