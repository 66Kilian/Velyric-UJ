import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";

// Kis, nagybetűs szekció-címke gradiens vonalkával
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-3 text-xs font-semibold tracking-[0.2em] text-muted uppercase",
        className,
      )}
    >
      <span aria-hidden="true" className="h-px w-8 bg-brand" />
      {children}
    </p>
  );
}

type SectionHeadingProps = {
  eyebrow: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  align?: "left" | "center";
  className?: string;
};

// Egységes szekció-fejléc: címke + nagy cím + opcionális bevezető
export function SectionHeading({ eyebrow, title, text, align = "left", className }: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        "flex max-w-3xl flex-col gap-5",
        align === "center" && "mx-auto items-center text-center",
        className,
      )}
    >
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="text-[2rem] leading-[1.1] font-bold tracking-[-0.02em] text-balance sm:text-5xl">
        {title}
      </h2>
      {text && <p className="max-w-2xl text-lg leading-relaxed text-pretty text-muted">{text}</p>}
    </Reveal>
  );
}
