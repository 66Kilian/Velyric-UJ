import type { NextRequest } from "next/server";
import { z } from "zod";
import { getApiUser, isSameOrigin, json, rateLimit, readJson } from "@/lib/server/guard";
import { getStripe, stripeConfigured } from "@/lib/server/stripe";
import { upsertSubscription } from "@/lib/supabase/admin";

const inputSchema = z.object({ sessionId: z.string().regex(/^cs_[A-Za-z0-9_]{10,200}$/) });

// Visszatérés a fizetőoldalról: a Stripe-tól (nem a böngészőtől) kérdezzük meg, sikerült-e,
// és csak a saját fizetését ellenőrizheti a felhasználó.
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return json({ error: "forbidden" }, 403);
  if (!stripeConfigured) return json({ error: "not_configured" }, 503);
  const user = await getApiUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  if (!rateLimit(`verify:${user.id}`, 20, 10 * 60_000)) return json({ error: "rate_limited" }, 429);

  let parsed;
  try {
    parsed = inputSchema.safeParse(await readJson(request, 1000));
  } catch {
    return json({ error: "invalid" }, 400);
  }
  if (!parsed.success) return json({ error: "invalid" }, 400);

  try {
    const session = await getStripe().checkout.sessions.retrieve(parsed.data.sessionId);
    if (session.client_reference_id !== user.id) return json({ error: "forbidden" }, 403);
    const paid = session.status === "complete" && session.payment_status !== "unpaid";
    if (paid) {
      await upsertSubscription({
        user_id: user.id,
        stripe_customer_id: typeof session.customer === "string" ? session.customer : (session.customer?.id ?? null),
        stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : (session.subscription?.id ?? null),
        checkout_session_id: session.id,
        status: "active",
      });
    }
    return json({ paid });
  } catch {
    return json({ error: "stripe" }, 502);
  }
}
