import type { NextRequest } from "next/server";
import { z } from "zod";
import { VOICE_IDS } from "@/lib/onboarding/schema";
import { getVoice } from "@/lib/onboarding/voices";
import { getApiUserOrDemo, isSameOrigin, json, rateLimit, readJson } from "@/lib/server/guard";

// Hangminta a választott hangon (ElevenLabs, többnyelvű modell).
// Ha nincs ELEVENLABS_API_KEY, 204-et adunk → a böngésző saját felolvasója szól (előnézet).
const inputSchema = z.object({
  voice: z.enum(VOICE_IDS),
  text: z.string().trim().min(1).max(400),
});

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return json({ error: "forbidden" }, 403);
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return new Response(null, { status: 204 });

  const user = await getApiUserOrDemo(request);
  if (!user) return new Response(null, { status: 204 });
  if (!rateLimit(`tts:${user.id}`, user.demo ? 10 : 40, 10 * 60_000)) return json({ error: "rate_limited" }, 429);

  let parsed;
  try {
    parsed = inputSchema.safeParse(await readJson(request, 4000));
  } catch {
    return json({ error: "invalid" }, 400);
  }
  if (!parsed.success) return json({ error: "invalid" }, 400);

  const persona = getVoice(parsed.data.voice);
  const voiceId = process.env[`ELEVENLABS_VOICE_${persona.id.toUpperCase()}`] || persona.elevenLabsDefault;

  const upstream = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        text: parsed.data.text,
        model_id: process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true },
      }),
      signal: AbortSignal.timeout(20_000),
    },
  ).catch(() => null);

  if (!upstream?.ok || !upstream.body) {
    console.error(`[tts] upstream ${upstream?.status ?? "network"}`);
    return new Response(null, { status: 204 });
  }
  return new Response(upstream.body, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, no-store" },
  });
}
