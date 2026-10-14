import type { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  label: string;
  value: number;
  description: string;
  icon: LucideIcon;
  iconClass: string;
}

export function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  iconClass,
}: SummaryCardProps) {
  return (
    <article className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-shadow hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] sm:p-5">
      <div className="flex items-start justify-between">
        <span
          className={`inline-flex size-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
        </span>
        <span className="rounded-md bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-500">
          Arbetsyta
        </span>
      </div>
      <p className="mt-5 text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-1 flex items-baseline justify-between gap-3">
        <p className="text-[32px] font-semibold leading-none tracking-tight text-slate-950">
          {value}
        </p>
        <p className="text-right text-xs text-slate-400">{description}</p>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Baserat på dina sparade uppgifter
      </p>
    </article>
  );
}
