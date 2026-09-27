"use client";

import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | null;
};

const inputClass =
  "h-12 w-full rounded-xl border bg-base-900/70 px-4 text-[16px] text-fg placeholder:text-muted/60 " +
  "transition-[border-color,box-shadow] duration-200 outline-none " +
  "focus:border-brand-pink/70 focus:shadow-[0_0_0_4px_rgb(229_35_126/0.15)]";

// Címkés beviteli mező, azonnali, barátságos hibaüzenettel
export const TextField = forwardRef<HTMLInputElement, FieldProps>(function TextField(
  { label, error, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={inputId} className="text-sm font-medium text-fg/90">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(inputClass, error ? "border-danger/70" : "border-line-strong")}
        {...props}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
});

// Jelszómező szem-ikonnal (mutat/elrejt)
export const PasswordField = forwardRef<HTMLInputElement, FieldProps & { children?: React.ReactNode }>(
  function PasswordField({ label, error, className, id, children, ...props }, ref) {
    const t = useTranslations("auth.common");
    const [visible, setVisible] = useState(false);
    const autoId = useId();
    const inputId = id ?? autoId;
    const errorId = `${inputId}-error`;

    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <label htmlFor={inputId} className="text-sm font-medium text-fg/90">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            aria-invalid={!!error || undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn(inputClass, "pr-12", error ? "border-danger/70" : "border-line-strong")}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? t("hidePassword") : t("showPassword")}
            aria-pressed={visible}
            className="absolute top-0 right-0 flex size-12 items-center justify-center rounded-xl text-muted transition-colors hover:text-fg"
          >
            {visible ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
          </button>
        </div>
        {children}
        <FieldError id={errorId} message={error} />
      </div>
    );
  },
);

function FieldError({ id, message }: { id: string; message?: string | null }) {
  if (!message) return null;
  return (
    <p id={id} className="flex items-center gap-1.5 text-sm text-danger">
      <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}
