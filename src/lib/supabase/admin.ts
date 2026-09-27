import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./config";

// Szerveroldali, emelt jogú Supabase kliens – KIZÁRÓLAG megbízható szerverkódban (Stripe webhook,
// fizetés-ellenőrzés). A kulcs sosem kerülhet a böngészőbe (nincs NEXT_PUBLIC_ előtag).
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceKey) return null;
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type SubscriptionRow = {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id?: string | null;
  checkout_session_id?: string | null;
  status: string;
};

// Előfizetés állapotának rögzítése (idempotens: user_id szerint felülír)
export async function upsertSubscription(row: SubscriptionRow) {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  const { error } = await admin
    .from("subscriptions")
    .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) console.error(`[billing] subscription upsert failed: ${error.code}`);
}
