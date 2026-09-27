"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { MIN_PASSWORD, passwordScore } from "@/lib/auth";
import { cn } from "@/lib/cn";

const colors = ["", "bg-danger", "bg-warning", "bg-success", "bg-success"];
const labels = ["", "weak", "fair", "strong", "veryStrong"] as const;

// A követelmény már gépelés ELŐTT látszik, és élőben pipálódik; mellette erősségjelző
export function StrengthMeter({ password }: { password: string }) {
  const t = useTranslations("auth.strength");
  const score = passwordScore(password);
  const longEnough = password.length >= MIN_PASSWORD;

  return (
    <div className="flex flex-col gap-2">
      <p className={cn("flex items-center gap-1.5 text-xs transition-colors", longEnough ? "text-success" : "text-muted")}>
        <Check className={cn("size-3.5", longEnough ? "opacity-100" : "opacity-40")} aria-hidden="true" />
        {t("minLength")}
      </p>
      {password && (
        <div aria-live="polite" className="flex flex-col gap-1.5">
          <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
            {[1, 2, 3, 4].map((level) => (
              <span
                key={level}
                className={cn(
                  "h-1 rounded-full transition-colors duration-300",
                  level <= score ? colors[score] : "bg-line-strong",
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted">
            {t("label")} <span className="font-semibold text-fg">{t(labels[score] || "weak")}</span>
            {score > 0 && score < 3 && <span className="block pt-0.5">{t("hint")}</span>}
          </p>
        </div>
      )}
    </div>
  );
}
