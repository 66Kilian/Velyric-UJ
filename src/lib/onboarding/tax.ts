// Adószám-ellenőrzés gépelés közben (a formátum és az ellenőrző számjegy – nem NAV-lekérdezés)

const HU_COUNTIES = new Set([
  ...Array.from({ length: 19 }, (_, i) => String(i + 2).padStart(2, "0")), // 02–20
  "22",
  "41",
  "42",
  "43",
  "44",
  "51",
]);

// Magyar adószám: 12345678-1-12 (törzsszám + ÁFA-kód + területi kód).
// A törzsszám 8. jegye ellenőrző szám: 9-7-3-1 súlyozás az első hét jegyre.
export function isValidHuTaxNumber(value: string): boolean {
  const m = value.trim().match(/^(\d{8})-?(\d)-?(\d{2})$/);
  if (!m) return false;
  const [, base, vat, county] = m;
  const weights = [9, 7, 3, 1, 9, 7, 3];
  const sum = weights.reduce((acc, w, i) => acc + w * Number(base[i]), 0);
  const check = (10 - (sum % 10)) % 10;
  return check === Number(base[7]) && Number(vat) >= 1 && Number(vat) <= 5 && HU_COUNTIES.has(county);
}

// Egységes megjelenítés: 12345678-1-12
export function formatHuTaxNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 8) return digits;
  if (digits.length === 9) return `${digits.slice(0, 8)}-${digits[8]}`;
  return `${digits.slice(0, 8)}-${digits[8]}-${digits.slice(9)}`;
}

const EU_VAT_PATTERNS: Record<string, RegExp> = {
  HU: /^HU\d{8}$/,
  AT: /^ATU\d{8}$/,
  DE: /^DE\d{9}$/,
};

// Közösségi (EU) adószám: országkód + szám (pl. HU12345678, ATU12345678, DE123456789)
export function normalizeEuVat(value: string): string {
  return value.toUpperCase().replace(/[\s.-]/g, "");
}

export function isValidEuVat(value: string): boolean {
  const v = normalizeEuVat(value);
  const pattern = EU_VAT_PATTERNS[v.slice(0, 2)];
  return pattern ? pattern.test(v) : /^[A-Z]{2}[A-Z0-9+*]{2,13}$/.test(v);
}

// A magyar közösségi adószám a belföldi adószám törzsszámából képződik
export function huEuVatFromTaxNumber(taxNumber: string): string | null {
  return isValidHuTaxNumber(taxNumber) ? `HU${taxNumber.replace(/\D/g, "").slice(0, 8)}` : null;
}
