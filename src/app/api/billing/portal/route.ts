import type { NextRequest } from "next/server";
import { getApiUser, isSameOrigin, json, rateLimit } from "@/lib/server/guard";
import { getStripe, stripeConfigured } from "@/lib/server/stripe";
import { getSupabaseServer } from "@/lib/supabase/server";

// Stripe ügyfélportál: számlák letöltése, kártyacsere, lemondás – a Stripe biztonságos oldalán
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return json({ error: "forbidden" }, 403);
  if (!stripeConfigured) return json({ error: "not_configured" }, 503);
  const user = await getApiUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  if (!rateLimit(`portal:${user.id}`, 10, 10 * 60_000)) return json({ error: "rate_limited" }, 429);

  const supabase = await getSupabaseServer();
  const { data: sub } = await supabase.from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  if (!sub?.stripe_customer_id) return json({ error: "no_customer" }, 404);
  const back = request.headers.get("referer")?.startsWith(request.nextUrl.origin) ? request.headers.get("referer")! : request.nextUrl.origin;
  const session = await getStripe().billingPortal.sessions.create({ customer: sub.stripe_customer_id, return_url: back });
  return json({ url: session.url });
}
