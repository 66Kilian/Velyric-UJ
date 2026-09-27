"use client";

import { useTranslations } from "next-intl";
import { passwordScore } from "@/lib/auth";
import { cn } from "@/lib/cn";

const colors = ["", "bg-rose-400", "bg-amber-400", "bg-emerald-400", "bg-emerald-400"];
const labels = ["", "weak", "fair", "strong", "veryStrong"] as const;

// Valós idejű jelszóerősség-jelző (4 sáv + szöveg)
export function StrengthMeter({ password }: { password: string }) {
  const t = useTranslations("auth.strength");
  const score = passwordScore(password);
  if (!password) return null;

  return (
    <div className="flex flex-col gap-1.5" aria-live="polite">
      <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1 rounded-full transition-colors duration-300",
              i <= score ? colors[score] : "bg-line-strong",
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted">
        {t("label")} <span className="font-semibold text-fg">{t(labels[score] || "weak")}</span>
        {score > 0 && score < 3 && <span className="block pt-0.5">{t("hint")}</span>}
      </p>
    </div>
  );
}
