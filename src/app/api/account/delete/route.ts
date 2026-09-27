import type { NextRequest } from "next/server";
import { z } from "zod";
import { getApiUser, isSameOrigin, json, rateLimit, readJson } from "@/lib/server/guard";
import { getStripe, stripeConfigured } from "@/lib/server/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServer } from "@/lib/supabase/server";

const inputSchema = z.object({ confirmEmail: z.string().max(200), password: z.string().max(200).optional() });

// GDPR – elfeledtetéshez való jog: a fiók és MINDEN kapcsolódó adat végleges törlése.
// Megerősítés: az e-mail-cím begépelése + (jelszavas fióknál) a jelszó újra.
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return json({ error: "forbidden" }, 403);
  const user = await getApiUser();
  if (!user?.email) return json({ error: "unauthorized" }, 401);
  if (!rateLimit(`delete:${user.id}`, 5, 60 * 60_000)) return json({ error: "rate_limited" }, 429);
  const admin = getSupabaseAdmin();
  if (!admin) return json({ error: "not_configured" }, 503);

  let input;
  try {
    input = inputSchema.parse(await readJson(request, 2000));
  } catch {
    return json({ error: "invalid" }, 400);
  }
  if (input.confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) return json({ error: "email_mismatch" }, 400);

  // Jelszavas fióknál a jelszót újra ellenőrizzük (ellopott munkamenettel se lehessen törölni)
  const { data: full } = await admin.auth.admin.getUserById(user.id);
  const hasPassword = full.user?.identities?.some((i) => i.provider === "email");
  if (hasPassword) {
    const supabase = await getSupabaseServer();
    const { error } = await supabase.auth.signInWithPassword({ email: user.email, password: input.password ?? "" });
    if (error) return json({ error: "wrong_password" }, 400);
  }

  // Előfizetés lemondása (ne terheljünk tovább)
  if (stripeConfigured) {
    const { data: sub } = await admin.from("subscriptions").select("stripe_subscription_id").eq("user_id", user.id).maybeSingle();
    if (sub?.stripe_subscription_id) {
      await getStripe().subscriptions.cancel(sub.stripe_subscription_id).catch(() => null);
    }
  }

  // Feltöltött tudásbázis-fájlok törlése
  const { data: files } = await admin.storage.from("knowledge").list(user.id, { limit: 1000 });
  if (files?.length) await admin.storage.from("knowledge").remove(files.map((f) => `${user.id}/${f.name}`));

  // A felhasználó törlése → minden tábla sora kaszkádolva törlődik
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return json({ error: "failed" }, 500);
  const supabase = await getSupabaseServer();
  await supabase.auth.signOut().catch(() => null);
  return json({ ok: true });
}
