import type { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  label: string;
  value: number;
  description: string;
  icon: LucideIcon;
  iconClass: string;
  onClick?: () => void;
  actionLabel?: string;
}

const baseClass =
  "block w-full rounded-xl border border-slate-200/60 bg-white p-5 text-left shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition-shadow";

export function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  iconClass,
  onClick,
  actionLabel,
}: SummaryCardProps) {
  const content = (
    <>
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
        <p className="text-right text-xs text-slate-500">{description}</p>
      </div>
      {actionLabel && (
        <p className="mt-3 text-xs font-medium text-indigo-700">{actionLabel} →</p>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClass} cursor-pointer hover:border-indigo-200 hover:shadow-[0_8px_20px_rgba(79,70,229,0.10)] focus-visible:outline-offset-2`}
      >
        {content}
      </button>
    );
  }

  return (
    <article className={`${baseClass} hover:shadow-[0_8px_20px_rgba(79,70,229,0.08)]`}>
      {content}
    </article>
  );
}
