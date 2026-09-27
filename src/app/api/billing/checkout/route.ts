import type { NextRequest } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { getPathname } from "@/i18n/navigation";
import { billingSchema } from "@/lib/onboarding/schema";
import { huEuVatFromTaxNumber, normalizeEuVat } from "@/lib/onboarding/tax";
import { billingErrors } from "@/lib/onboarding/validate";
import { getApiUser, isSameOrigin, json, rateLimit, readJson } from "@/lib/server/guard";
import { getStripe, isUuid, priceId, stripeConfigured } from "@/lib/server/stripe";

const inputSchema = z.object({ locale: z.enum(["hu", "en", "de"]), billing: billingSchema });

// Stripe fizetőoldal indítása: ügyfél (név, cím, adószám) létrehozása/frissítése, majd Checkout.
// A fizetés a Stripe oldalán történik (kártya, Apple Pay, Google Pay), utána ide tér vissza.
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return json({ error: "forbidden" }, 403);
  if (!stripeConfigured) return json({ error: "not_configured" }, 503);
  const user = await getApiUser();
  if (!user || !isUuid(user.id)) return json({ error: "unauthorized" }, 401);
  if (!rateLimit(`checkout:${user.id}`, 10, 10 * 60_000)) return json({ error: "rate_limited" }, 429);

  let parsed;
  try {
    parsed = inputSchema.safeParse(await readJson(request));
  } catch {
    return json({ error: "invalid" }, 400);
  }
  if (!parsed.success) return json({ error: "invalid" }, 400);
  const { locale, billing } = parsed.data;
  if (Object.keys(billingErrors(billing)).length) return json({ error: "invalid_billing" }, 400);

  const stripe = getStripe();
  try {
    const address = {
      line1: billing.address,
      postal_code: billing.zip,
      city: billing.city,
      country: billing.country === "OTHER" ? undefined : billing.country,
    };
    const found = await stripe.customers.search({ query: `metadata['user_id']:'${user.id}'`, limit: 1 });
    const fields = {
      name: billing.name,
      email: billing.email,
      phone: billing.phone || undefined,
      address,
      preferred_locales: [locale],
      metadata: { user_id: user.id, customer_type: billing.type },
    };
    const customer = found.data[0]
      ? await stripe.customers.update(found.data[0].id, fields)
      : await stripe.customers.create(fields);

    // Adószámok a számlára (cégnél): magyar adószám + közösségi adószám
    if (billing.type === "company") {
      const wanted: { type: Stripe.CustomerCreateTaxIdParams.Type; value: string }[] = [];
      if (billing.country === "HU") wanted.push({ type: "hu_tin", value: billing.taxNumber.trim() });
      const euVat = billing.euVat ? normalizeEuVat(billing.euVat) : billing.country === "HU" ? huEuVatFromTaxNumber(billing.taxNumber) : null;
      if (euVat) wanted.push({ type: "eu_vat", value: euVat });
      const existing = await stripe.customers.listTaxIds(customer.id, { limit: 20 });
      for (const tax of wanted) {
        if (existing.data.some((e) => e.type === tax.type && e.value === tax.value)) continue;
        await stripe.customers.createTaxId(customer.id, tax);
      }
    }

    const price = await stripe.prices.retrieve(priceId);
    const setupPath = getPathname({ locale, href: "/beallitas" });
    const origin = request.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({
      mode: price.type === "recurring" ? "subscription" : "payment",
      customer: customer.id,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      locale: locale === "hu" ? "hu" : locale,
      metadata: { user_id: user.id },
      ...(price.type === "recurring" ? { subscription_data: { metadata: { user_id: user.id } } } : {}),
      customer_update: { name: "auto", address: "auto" },
      allow_promotion_codes: true,
      ...(process.env.STRIPE_AUTOMATIC_TAX === "1" ? { automatic_tax: { enabled: true } } : {}),
      success_url: `${origin}${setupPath}?fizetes=siker&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${setupPath}?fizetes=megszakitva`,
    });
    if (!session.url) return json({ error: "stripe" }, 502);
    return json({ url: session.url });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeInvalidRequestError && error.param?.includes("value")) {
      return json({ error: "tax_rejected" }, 400);
    }
    console.error(`[billing] checkout failed: ${error instanceof Stripe.errors.StripeError ? error.code ?? error.type : "unknown"}`);
    return json({ error: "stripe" }, 502);
  }
}
