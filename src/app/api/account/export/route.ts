import { getApiUser, rateLimit } from "@/lib/server/guard";
import { getSupabaseServer } from "@/lib/supabase/server";

// GDPR – adathordozhatóság: a felhasználó MINDEN adata egy JSON-fájlban (a saját jogosultságával olvasva)
export async function GET() {
  const user = await getApiUser();
  if (!user) return new Response("unauthorized", { status: 401 });
  if (!rateLimit(`export:${user.id}`, 5, 60 * 60_000)) return new Response("rate limited", { status: 429 });

  const supabase = await getSupabaseServer();
  const [onboarding, workspace, calls, issues, bookings, support, security, subscription] = await Promise.all([
    supabase.from("onboarding").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("workspaces").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("calls").select("*").eq("user_id", user.id).order("started_at", { ascending: false }),
    supabase.from("issues").select("*").eq("user_id", user.id),
    supabase.from("bookings").select("*").eq("user_id", user.id),
    supabase.from("support_requests").select("*").eq("user_id", user.id),
    supabase.from("security_events").select("type, created_at").eq("user_id", user.id),
    supabase.from("subscriptions").select("status, updated_at").eq("user_id", user.id).maybeSingle(),
  ]);

  const body = JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      account: { id: user.id, email: user.email },
      onboarding: onboarding.data,
      workspace: workspace.data,
      subscription: subscription.data,
      calls: calls.data ?? [],
      issues: issues.data ?? [],
      bookings: bookings.data ?? [],
      support_requests: support.data ?? [],
      security_events: security.data ?? [],
    },
    null,
    2,
  );
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="velyric-adataim-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
