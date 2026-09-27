import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const styles = {
  error: { box: "border-danger/30 bg-danger/10 text-danger", Icon: AlertCircle },
  success: { box: "border-success/30 bg-success/10 text-success", Icon: CheckCircle2 },
  info: { box: "border-line-strong bg-base-700/60 text-fg/90", Icon: Info },
} as const;

// Üzenetsáv az űrlap tetején (hiba / siker / infó)
export function FormAlert({
  kind,
  children,
  className,
}: {
  kind: keyof typeof styles;
  children: ReactNode;
  className?: string;
}) {
  const { box, Icon } = styles[kind];
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed", box, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="flex-1">{children}</div>
    </div>
  );
}
