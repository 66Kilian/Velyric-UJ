import type { NextRequest } from "next/server";
import { z } from "zod";
import { isValidEmail } from "@/lib/auth";
import { clientIp, getApiUser, isSameOrigin, json, rateLimit, readJson } from "@/lib/server/guard";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const inputSchema = z.object({
  email: z.string().trim().max(200),
  topic: z.string().trim().max(120),
  message: z.string().trim().min(5).max(4000),
});

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Súgó → „Írj nekünk”: az üzenet elmentve (Supabase), és ha van Resend-kulcs, e-mailben is megérkezik.
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return json({ error: "forbidden" }, 403);
  const user = await getApiUser();
  if (!rateLimit(`support:${user?.id ?? clientIp(request)}`, 5, 60 * 60_000)) return json({ error: "rate_limited" }, 429);

  let input;
  try {
    input = inputSchema.parse(await readJson(request, 10_000));
  } catch {
    return json({ error: "invalid" }, 400);
  }
  const email = user?.email ?? input.email;
  if (!isValidEmail(email)) return json({ error: "invalid_email" }, 400);

  let stored = false;
  const admin = getSupabaseAdmin();
  if (admin) {
    const { error } = await admin.from("support_requests").insert({ user_id: user?.id ?? null, email, topic: input.topic, message: input.message });
    stored = !error;
  }

  let mailed = false;
  const key = process.env.RESEND_API_KEY;
  const to = process.env.SUPPORT_EMAIL;
  if (key && to) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.SUPPORT_FROM || "Velyric Súgó <sugo@velyric.com>",
        to: [to],
        reply_to: email,
        subject: `[Súgó] ${input.topic || "Üzenet"}`,
        html: `<p><strong>Feladó:</strong> ${escapeHtml(email)}</p><p><strong>Téma:</strong> ${escapeHtml(input.topic)}</p><p>${escapeHtml(input.message).replace(/\n/g, "<br>")}</p>`,
      }),
      signal: AbortSignal.timeout(10_000),
    }).catch(() => null);
    mailed = !!res?.ok;
  }

  if (!stored && !mailed) return json({ error: "not_configured" }, 503);
  return json({ ok: true });
}
