import type { NextRequest } from "next/server";
import { aiInputSchema } from "@/lib/onboarding/schema";
import { analyzeBusiness, draftMessages } from "@/lib/server/ai";
import { clientIp, getApiUserOrDemo, isSameOrigin, json, rateLimit, readJson } from "@/lib/server/guard";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// A beállítás MI-je: cégleírás elemzése (analyze) és üdvözlő/köszönő szöveg (messages).
// Csak bejelentkezett felhasználónak, a saját oldalunkról, percenként korlátozva.
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return json({ error: "forbidden" }, 403);
  const user = await getApiUserOrDemo(request);
  // Bemutató módban, MI-engedély nélkül is végigjárható a folyamat – ilyenkor sablonokkal (nincs költség)
  const templatesOnly = !user && !isSupabaseConfigured;
  if (!user && !templatesOnly) return json({ error: "unauthorized" }, 401);
  const key = user?.id ?? `tpl:${clientIp(request)}`;
  if (!rateLimit(`ai:${key}`, user && !user.demo ? 30 : 15, 10 * 60_000)) return json({ error: "rate_limited" }, 429);

  let body: unknown;
  try {
    body = await readJson(request);
  } catch {
    return json({ error: "invalid" }, 400);
  }
  const parsed = aiInputSchema.safeParse(body);
  if (!parsed.success) return json({ error: "invalid" }, 400);

  const input = parsed.data;
  const result = input.action === "analyze" ? await analyzeBusiness(input, !templatesOnly) : await draftMessages(input, !templatesOnly);
  return json(result);
}
