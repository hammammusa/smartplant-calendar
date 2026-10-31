import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden>
      <rect width="40" height="40" rx="11" fill="#166534" />
      <rect x="8" y="12" width="24" height="20" rx="4" fill="#ffffff" fillOpacity="0.14" />
      <rect x="8" y="12" width="24" height="5" rx="2.5" fill="#ffffff" fillOpacity="0.25" />
      <path d="M14 9v5M26 9v5" stroke="#dcfce7" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M20 30c0-5 0-7 0-9" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M20 23c-5 0-7-3-7-6 4 0 7 2 7 6Z" fill="#a3e635" />
      <path d="M20 21c0-4 3-6 7-6 0 3-2 6-7 6Z" fill="#ffffff" />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {compact ? null : (
        <span className="flex flex-col leading-tight">
          <span className="text-[1.05rem] font-extrabold text-brand-700">رزنامة الزراعة الذكية</span>
          <span className="text-[0.7rem] font-medium text-subtle-foreground">خطط لمحاصيلك بثقة</span>
        </span>
      )}
    </span>
  );
}
