import { isValidEmail } from "@/lib/auth";
import type { Billing } from "./schema";
import { isValidEuVat, isValidHuTaxNumber } from "./tax";

export type BillingErrorKey =
  | "nameRequired"
  | "taxRequired"
  | "taxInvalid"
  | "euVatRequired"
  | "euVatInvalid"
  | "zipInvalid"
  | "cityRequired"
  | "addressRequired"
  | "emailInvalid"
  | "phoneInvalid"
  | "acceptRequired";

export type BillingErrors = Partial<Record<keyof Billing, BillingErrorKey>>;

export const isValidPhone = (value: string) => /^\+?[\d\s()/-]{8,20}$/.test(value.trim());

// Számlázási adatok ellenőrzése – ugyanez fut a böngészőben és a szerveren is
export function billingErrors(b: Billing): BillingErrors {
  const errors: BillingErrors = {};
  if (b.name.trim().length < 2) errors.name = "nameRequired";

  if (b.type === "company") {
    if (b.country === "HU") {
      if (!b.taxNumber.trim()) errors.taxNumber = "taxRequired";
      else if (!isValidHuTaxNumber(b.taxNumber)) errors.taxNumber = "taxInvalid";
      if (b.euVat.trim() && !isValidEuVat(b.euVat)) errors.euVat = "euVatInvalid";
    } else if (!b.euVat.trim()) errors.euVat = "euVatRequired";
    else if (!isValidEuVat(b.euVat)) errors.euVat = "euVatInvalid";
  }

  const zipOk = b.country === "HU" ? /^\d{4}$/.test(b.zip.trim()) : /^[A-Za-z0-9 -]{3,10}$/.test(b.zip.trim());
  if (!zipOk) errors.zip = "zipInvalid";
  if (b.city.trim().length < 2) errors.city = "cityRequired";
  if (b.address.trim().length < 4) errors.address = "addressRequired";
  if (!isValidEmail(b.email)) errors.email = "emailInvalid";
  if (b.phone.trim() && !isValidPhone(b.phone)) errors.phone = "phoneInvalid";
  if (!b.accepted) errors.accepted = "acceptRequired";
  return errors;
}
