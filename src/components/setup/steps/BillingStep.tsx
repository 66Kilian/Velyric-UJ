"use client";

import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/auth/Fields";
import { Link } from "@/i18n/navigation";
import type { Billing } from "@/lib/onboarding/schema";
import { formatHuTaxNumber, huEuVatFromTaxNumber, isValidHuTaxNumber, normalizeEuVat } from "@/lib/onboarding/tax";
import { billingErrors } from "@/lib/onboarding/validate";
import type { StepProps } from "../types";
import { FieldError, Segmented, fieldBase } from "../ui";

const COUNTRIES = ["HU", "AT", "DE", "OTHER"] as const;

// 5. LÉPÉS – számlázás: cég vagy magánszemély, adószám (élő ellenőrzéssel), cím, elérhetőség
export function BillingStep({ data, update, showErrors }: StepProps & { showErrors: boolean }) {
  const t = useTranslations("setup.billing");
  const b = data.billing;
  const errors = billingErrors(b);
  const err = (field: keyof Billing, force = false) => {
    const key = errors[field];
    return key && (showErrors || force) ? t(`errors.${key}`) : null;
  };
  const set = (patch: Partial<Billing>) => update((d) => ({ ...d, billing: { ...d.billing, ...patch } }));

  const company = b.type === "company";
  const hu = b.country === "HU";
  const taxOk = hu && isValidHuTaxNumber(b.taxNumber);
  const suggestedVat = hu && company ? huEuVatFromTaxNumber(b.taxNumber) : null;
  // Adószám: ha már teljes hosszú, rögtön jelezzük a hibát (nem csak továbblépéskor)
  const taxLive = b.taxNumber.replace(/\D/g, "").length >= 11;

  return (
    <div className="flex flex-col gap-7">
      <Segmented
        label={t("title")}
        value={b.type}
        onChange={(type) => set({ type })}
        options={[
          { value: "company", label: t("type.company") },
          { value: "individual", label: t("type.individual") },
        ]}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor="billing-country" className="text-sm font-medium text-ink/90">
            {t("country")}
          </label>
          <select
            id="billing-country"
            value={b.country}
            autoComplete="country"
            onChange={(e) => set({ country: e.target.value as Billing["country"], euVat: "" })}
            className={`${fieldBase} h-12 appearance-none border-line-strong bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-10`}
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23d9bccd' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
            }}
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {t(`countries.${c}`)}
              </option>
            ))}
          </select>
        </div>

        <TextField
          className="sm:col-span-2"
          label={company ? t("companyName") : t("fullName")}
          name={company ? "organization" : "name"}
          autoComplete={company ? "organization" : "name"}
          placeholder={company ? t("companyNamePlaceholder") : t("fullNamePlaceholder")}
          value={b.name}
          maxLength={140}
          onChange={(e) => set({ name: e.target.value })}
          error={err("name")}
        />

        {company && hu && (
          <div className="flex flex-col gap-2">
            <TextField
              label={t("taxNumber")}
              name="tax-number"
              inputMode="numeric"
              autoComplete="off"
              placeholder={t("taxNumberPlaceholder")}
              value={b.taxNumber}
              maxLength={13}
              onChange={(e) => set({ taxNumber: formatHuTaxNumber(e.target.value) })}
              error={err("taxNumber", taxLive)}
            />
            {taxOk && (
              <p className="flex items-center gap-1.5 text-sm text-success">
                <CheckCircle2 className="size-4" aria-hidden="true" />
                {t("taxValid")}
              </p>
            )}
          </div>
        )}

        {company && (
          <div className="flex flex-col gap-2">
            <TextField
              label={hu ? `${t("euVat")} (${t("optional")})` : t("euVat")}
              name="vat-number"
              autoComplete="off"
              placeholder={hu ? t("euVatPlaceholderHU") : t("euVatPlaceholder")}
              value={b.euVat}
              maxLength={20}
              onChange={(e) => set({ euVat: normalizeEuVat(e.target.value) })}
              error={err("euVat")}
            />
            {suggestedVat && !b.euVat && (
              <button
                type="button"
                onClick={() => set({ euVat: suggestedVat })}
                className="self-start text-sm font-semibold text-accent-ink underline-offset-4 hover:underline"
              >
                {t("euVatSuggest", { value: suggestedVat })}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-[9rem_1fr]">
        <TextField
          label={t("zip")}
          name="postal-code"
          autoComplete="postal-code"
          inputMode={hu ? "numeric" : "text"}
          value={b.zip}
          maxLength={12}
          onChange={(e) => set({ zip: e.target.value })}
          error={err("zip")}
        />
        <TextField
          label={t("city")}
          name="address-level2"
          autoComplete="address-level2"
          value={b.city}
          maxLength={80}
          onChange={(e) => set({ city: e.target.value })}
          error={err("city")}
        />
        <TextField
          className="sm:col-span-2"
          label={t("address")}
          name="street-address"
          autoComplete="street-address"
          placeholder={t("addressPlaceholder")}
          value={b.address}
          maxLength={160}
          onChange={(e) => set({ address: e.target.value })}
          error={err("address")}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label={t("email")}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          value={b.email}
          maxLength={160}
          onChange={(e) => set({ email: e.target.value })}
          error={err("email")}
        />
        <div className="flex flex-col gap-2">
          <TextField
            label={t("phone")}
            type="tel"
            name="tel"
            autoComplete="tel"
            inputMode="tel"
            value={b.phone}
            maxLength={30}
            onChange={(e) => set({ phone: e.target.value })}
            error={err("phone")}
          />
          {!err("phone") && <p className="text-xs text-muted">{t("phoneHint")}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
          <input
            type="checkbox"
            checked={b.accepted}
            onChange={(e) => set({ accepted: e.target.checked })}
            className="mt-0.5 size-5 shrink-0 accent-[#ff007a]"
          />
          <span className="text-ink/90">
            {t.rich("accept", {
              terms: (chunks) => (
                <Link href="/aszf" target="_blank" className="font-semibold underline underline-offset-2">
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link href="/adatvedelem" target="_blank" className="font-semibold underline underline-offset-2">
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>
        <FieldError message={err("accepted")} />
      </div>
    </div>
  );
}
