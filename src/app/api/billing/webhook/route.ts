import type { NextRequest } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/server/stripe";
import { upsertSubscription } from "@/lib/supabase/admin";

// Stripe webhook: a fizetés és az előfizetés állapota akkor is rögzül, ha a vásárló
// a fizetés után bezárja a böngészőt. Aláírás nélkül semmit nem fogadunk el.
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return new Response("not configured", { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return new Response("invalid signature", { status: 400 });
  }

  const idOf = (v: string | { id: string } | null) => (typeof v === "string" ? v : (v?.id ?? null));

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const s = event.data.object;
      if (s.client_reference_id && s.payment_status !== "unpaid") {
        await upsertSubscription({
          user_id: s.client_reference_id,
          stripe_customer_id: idOf(s.customer),
          stripe_subscription_id: idOf(s.subscription),
          checkout_session_id: s.id,
          status: "active",
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const userId = sub.metadata?.user_id;
      if (userId) {
        await upsertSubscription({
          user_id: userId,
          stripe_customer_id: idOf(sub.customer),
          stripe_subscription_id: sub.id,
          status: sub.status,
        });
      }
      break;
    }
  }
  return new Response("ok");
}
