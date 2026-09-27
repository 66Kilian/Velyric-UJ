import { json } from "@/lib/server/guard";
import { getPlan } from "@/lib/server/stripe";

// A választható csomag (név, ár, időszak) – nyilvános adat, a Stripe-ból
export async function GET() {
  return json(await getPlan());
}
