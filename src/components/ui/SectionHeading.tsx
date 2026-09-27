import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionHeadingProps = {
  id: string;
  /** Kis szekciónév – csak ha információt hordoz (navigációs cél) */
  label?: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  className?: string;
};

// Egységes szekció-fejléc: (név) + cím + bevezető. A szöveg a helyén jelenik meg,
// nem úszik be – a mozgás a képeké és a 3D jelé.
export function SectionHeading({ id, label, title, text, className }: SectionHeadingProps) {
  return (
    <div className={cn("flex max-w-3xl flex-col", className)}>
      {label && <p className="mb-4 text-sm font-semibold text-accent-ink">{label}</p>}
      <h2 id={id} className="text-title font-bold text-balance">
        {title}
      </h2>
      {text && <p className="mt-5 max-w-2xl text-lead text-pretty text-muted">{text}</p>}
    </div>
  );
}
