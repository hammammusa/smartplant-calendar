import { AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const tones = {
  info: { box: "border-info/20 bg-info-soft text-info", icon: Info },
  warning: { box: "border-warning-border bg-warning-soft text-warning", icon: AlertTriangle },
  success: { box: "border-success/20 bg-success-soft text-success", icon: CheckCircle2 },
  danger: { box: "border-danger/20 bg-danger-soft text-danger", icon: XCircle },
} as const;

export function Alert({
  tone = "info",
  title,
  children,
  className,
  action,
}: {
  tone?: keyof typeof tones;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  const { box, icon: Icon } = tones[tone];
  return (
    <div role={tone === "danger" ? "alert" : "note"} className={cn("flex gap-3 rounded-xl border p-4", box, className)}>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 text-sm leading-7">
        {title ? <p className="font-bold">{title}</p> : null}
        {children ? <div className="text-foreground/80">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0 self-center">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface px-6 py-10 text-center", className)}>
      <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Icon className="size-6" />
      </span>
      <div className="space-y-1">
        <p className="font-bold">{title}</p>
        {description ? <p className="mx-auto max-w-md text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("size-4 animate-spin", className)} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
