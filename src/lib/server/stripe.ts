import "server-only";
import Stripe from "stripe";

// Stripe (fizetés). Kártya, Apple Pay és Google Pay a Stripe saját, biztonságos fizetőoldalán –
// kártyaadat soha nem érinti a mi szerverünket. Kulcs nélkül a fizetés bemutató módban fut.
const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
export const priceId = process.env.STRIPE_PRICE_ID ?? "";
export const stripeConfigured = Boolean(secretKey && priceId);

let stripe: Stripe | null = null;
export const getStripe = () => (stripe ??= new Stripe(secretKey, { maxNetworkRetries: 1, timeout: 20_000 }));

export type PlanInfo = {
  configured: boolean;
  name: string | null;
  amount: number | null;
  currency: string | null;
  interval: "day" | "week" | "month" | "year" | null;
  oneTime: boolean;
};

let cached: { at: number; plan: PlanInfo } | null = null;

// A csomag adatai egyenesen a Stripe-ból – az oldalon nincs kézzel beírt (és elavulható) ár
export async function getPlan(): Promise<PlanInfo> {
  const empty: PlanInfo = { configured: false, name: null, amount: null, currency: null, interval: null, oneTime: false };
  if (!stripeConfigured) return empty;
  if (cached && Date.now() - cached.at < 10 * 60_000) return cached.plan;
  try {
    const price = await getStripe().prices.retrieve(priceId, { expand: ["product"] });
    const product = typeof price.product === "object" && !("deleted" in price.product && price.product.deleted) ? price.product : null;
    const plan: PlanInfo = {
      configured: true,
      name: product && "name" in product ? product.name : null,
      amount: price.unit_amount,
      currency: price.currency,
      interval: (price.recurring?.interval as PlanInfo["interval"]) ?? null,
      oneTime: price.type === "one_time",
    };
    cached = { at: Date.now(), plan };
    return plan;
  } catch (error) {
    console.error(`[billing] price lookup failed: ${error instanceof Stripe.errors.StripeError ? error.code : "unknown"}`);
    return { ...empty, configured: true };
  }
}

export const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
