"use client";

import { AlertCircle, Check } from "lucide-react";
import { forwardRef, useId, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// A beállítás közös építőelemei: többsoros mező, választókártya, kapcsoló, szekciócím

export const fieldBase =
  "w-full rounded-xl border bg-canvas/70 px-4 text-[16px] text-ink placeholder:text-muted/55 " +
  "transition-[border-color,box-shadow] duration-200 outline-none " +
  "focus:border-brand-pink/70 focus:shadow-[0_0_0_4px_rgb(255_0_122/0.14)]";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  counter?: { value: number; max: number };
  aside?: ReactNode;
};

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, hint, error, counter, aside, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = [hint && `${inputId}-hint`, error && `${inputId}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={inputId} className="text-sm font-medium text-ink/90">
          {label}
        </label>
        {aside}
      </div>
      <textarea
        ref={ref}
        id={inputId}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy}
        className={cn(fieldBase, "min-h-28 resize-y py-3 leading-relaxed", error ? "border-danger/70" : "border-line-strong")}
        {...props}
      />
      <div className="flex items-start justify-between gap-4">
        {error ? (
          <FieldError id={`${inputId}-error`} message={error} />
        ) : hint ? (
          <p id={`${inputId}-hint`} className="text-xs leading-relaxed text-muted">
            {hint}
          </p>
        ) : (
          <span />
        )}
        {counter && (
          <span className={cn("tabular shrink-0 text-xs", counter.value > counter.max ? "text-danger" : "text-muted")}>
            {counter.value}/{counter.max}
          </span>
        )}
      </div>
    </div>
  );
});

export function FieldError({ id, message }: { id?: string; message?: string | null }) {
  if (!message) return null;
  return (
    <p id={id} className="flex items-center gap-1.5 text-sm text-danger">
      <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

// Szekció a lépésen belül (cím + opcionális leírás)
export function Section({ title, text, children, className }: { title: ReactNode; text?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <div>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        {text && <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>}
      </div>
      {children}
    </section>
  );
}

// Választókártya (rádió-szerű). A kiválasztott gradiens keretet és pipát kap.
// A „footer” a címkén kívül kerül (pl. lejátszás gomb), így nem lesz gomb a <label> belsejében.
export function ChoiceCard({
  selected,
  onSelect,
  title,
  text,
  icon,
  name,
  value,
  className,
  footer,
}: {
  selected: boolean;
  onSelect: () => void;
  title: ReactNode;
  text?: ReactNode;
  icon?: ReactNode;
  name: string;
  value: string;
  className?: string;
  footer?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-panel border transition-[border-color,background-color,box-shadow] duration-200",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-accent-ink",
        selected ? "border-brand shadow-lift" : "border-line-strong bg-canvas/40 hover:border-ink/25 hover:bg-raised/40",
        className,
      )}
    >
      <label className="flex flex-1 cursor-pointer flex-col gap-1.5 p-4 sm:p-5">
        <input type="radio" name={name} value={value} checked={selected} onChange={onSelect} className="sr-only" />
        <span className="flex items-start justify-between gap-3">
          <span className="flex items-center gap-3">
            {icon}
            <span className="font-semibold">{title}</span>
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
              selected ? "border-transparent bg-cta text-white" : "border-line-strong",
            )}
          >
            {selected && <Check className="size-3" strokeWidth={3} />}
          </span>
        </span>
        {text && <span className="text-sm leading-relaxed text-muted">{text}</span>}
      </label>
      {footer && <div className="-mt-2 px-4 pb-4 sm:px-5 sm:pb-5">{footer}</div>}
    </div>
  );
}

// Igen / Nem kapcsoló (a feladatokhoz) – valódi switch szerep, képernyőolvasóval is
export function YesNo({
  checked,
  onChange,
  yes,
  no,
  labelledBy,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  yes: string;
  no: string;
  labelledBy: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      onClick={() => onChange(!checked)}
      className="relative grid h-10 w-[7.5rem] shrink-0 grid-cols-2 items-center rounded-full border border-line-strong bg-canvas/70 p-1 text-xs font-semibold"
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-1 w-[calc(50%-4px)] rounded-full transition-[left,background-color] duration-300 ease-out",
          checked ? "left-[calc(50%+2px)] bg-cta" : "left-1 bg-raised",
        )}
      />
      <span className={cn("relative z-10 text-center transition-colors", checked ? "text-muted" : "text-ink")}>{no}</span>
      <span className={cn("relative z-10 text-center transition-colors", checked ? "text-white" : "text-muted")}>{yes}</span>
    </button>
  );
}

// Szegmentált választó (pl. Cég / Magánszemély)
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-flow-col gap-1 rounded-xl border border-line-strong bg-canvas/60 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "min-h-11 rounded-lg px-3 text-sm font-semibold transition-colors",
            value === o.value ? "bg-raised text-ink shadow-float" : "text-muted hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Kis hanghullám (lejátszás közben)
export function VoiceBars({ active, className }: { active: boolean; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("flex h-4 items-center gap-[3px]", className)}>
      {[0.45, 0.9, 0.6, 1, 0.5].map((h, i) => (
        <span
          key={i}
          className={cn("w-[3px] rounded-full bg-brand transition-transform", active && "voice-bar")}
          style={{ height: `${h * 100}%`, animationDelay: `${i * 90}ms`, transform: active ? undefined : "scaleY(0.35)" }}
        />
      ))}
    </span>
  );
}
