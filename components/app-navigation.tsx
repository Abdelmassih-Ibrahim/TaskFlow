"use client";

import {
  BarChart3,
  CalendarDays,
  CheckSquare2,
  ChevronDown,
  CircleHelp,
  Command,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const primaryNavigation = [
  { label: "Dashboard", href: "#dashboard", icon: LayoutDashboard, active: true },
  { label: "My tasks", href: "#task-overview", icon: CheckSquare2, active: false },
];

const demoNavigation = [
  { label: "Projects", icon: FolderKanban },
  { label: "Calendar", icon: CalendarDays },
  { label: "Reports", icon: BarChart3 },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="flex h-[76px] items-center gap-3 px-6">
        <span className="flex size-9 items-center justify-center rounded-xl bg-teal-400 text-slate-950 shadow-sm shadow-teal-950/20">
          <Command size={19} strokeWidth={2.6} aria-hidden="true" />
        </span>
        <span className="text-[17px] font-semibold tracking-tight text-white">
          taskflow<span className="text-teal-400">.</span>
        </span>
      </div>

      <div className="mx-4 mb-6 rounded-xl border border-white/10 bg-white/[0.06] p-3">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-400/20 text-xs font-semibold text-indigo-200">
              A
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-100">
                Atlas Studio
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">Demo workspace</p>
            </div>
          </div>
          <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-slate-500" />
        </div>
      </div>

      <nav aria-label="Main navigation" className="flex-1 px-3">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Workspace
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
                  className={active ? "text-teal-300" : "text-slate-500"}
                />
                {label}
                {label === "My tasks" && (
                  <span className="ml-auto rounded-md bg-white/[0.08] px-1.5 py-0.5 text-[10px] text-slate-400">
                    10
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>

        <p className="mb-2 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Organize
        </p>
        <ul className="space-y-1">
          {demoNavigation.map(({ label, icon: Icon }) => (
            <li key={label}>
              <span
                aria-disabled="true"
                title={`${label} is not available in this demo`}
                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-500"
              >
                <Icon size={17} aria-hidden="true" className="text-slate-600" />
                {label}
                <span className="ml-auto text-[9px] font-semibold uppercase tracking-wide text-slate-600">
                  Soon
                </span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-8 border-t border-white/[0.08] pt-5">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Your projects
          </p>
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-slate-400">
            <span className="size-2 rounded-full bg-blue-400" />
            Website redesign
            <span className="ml-auto text-[10px] text-slate-600">3</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-slate-400">
            <span className="size-2 rounded-full bg-violet-400" />
            Mobile app
            <span className="ml-auto text-[10px] text-slate-600">4</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-slate-400">
            <span className="size-2 rounded-full bg-amber-400" />
            Brand refresh
            <span className="ml-auto text-[10px] text-slate-600">2</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-slate-400">
            <span className="size-2 rounded-full bg-teal-400" />
            Customer experience
            <span className="ml-auto text-[10px] text-slate-600">1</span>
          </div>
        </div>
      </nav>

      <div className="space-y-1 border-t border-white/[0.08] px-3 py-4">
        <span
          aria-disabled="true"
          title="Settings are not available in this demo"
          className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-slate-500"
        >
          <Settings2 size={16} aria-hidden="true" className="text-slate-600" />
          Settings
        </span>
        <span
          aria-disabled="true"
          title="Help is not available in this demo"
          className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-slate-500"
        >
          <CircleHelp size={16} aria-hidden="true" className="text-slate-600" />
          Help &amp; support
        </span>
        <div className="mt-3 flex items-center gap-3 border-t border-white/[0.08] px-3 pt-4">
          <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-orange-300 text-[11px] font-bold text-orange-950">
            AL
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-slate-200">Alex Morgan</p>
            <p className="truncate text-[10px] text-slate-500">Sample profile</p>
          </div>
        </div>
      </div>
    </>
  );
}

export function AppNavigation() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col bg-[#111827] lg:flex">
        <SidebarContent />
        <div className="mx-4 mb-4 flex items-center gap-2 rounded-lg bg-teal-400/[0.08] px-3 py-2.5 text-[11px] text-teal-100/80">
          <Sparkles size={14} aria-hidden="true" className="text-teal-300" />
          A calm space for focused work
        </div>
      </aside>

      <div className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
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
          <span className="flex size-7 items-center justify-center rounded-lg bg-teal-400 text-slate-950">
            <Command size={15} strokeWidth={2.6} aria-hidden="true" />
          </span>
          taskflow<span className="-ml-2 text-teal-600">.</span>
        </Link>
        <span aria-hidden="true" className="size-10" />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 cursor-default bg-slate-950/50"
          />
          <aside
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="absolute inset-y-0 left-0 flex w-[min(300px,86vw)] flex-col bg-[#111827] shadow-2xl"
          >
            <div className="absolute right-3 top-5 z-10">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
                className="inline-flex size-9 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <X size={19} aria-hidden="true" />
              </button>
            </div>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
            <div className="mx-4 mb-4 flex items-center gap-2 rounded-lg bg-teal-400/[0.08] px-3 py-2.5 text-[11px] text-teal-100/80">
              <Sparkles size={14} aria-hidden="true" className="text-teal-300" />
              A calm space for focused work
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
