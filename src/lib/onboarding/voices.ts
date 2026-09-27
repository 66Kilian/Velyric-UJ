import type { VoiceId } from "./schema";

// A választható hangok. A valódi hang (ElevenLabs) a szerveren, környezeti változóból jön;
// kulcs nélkül a böngésző beépített felolvasója ad előnézetet (hangmagassággal, tempóval hangolva).
export type VoicePersona = {
  id: VoiceId;
  name: string;
  gender: "female" | "male";
  /** Böngészős előnézet hangolása */
  pitch: number;
  rate: number;
  /** Alap ElevenLabs hang-azonosító (felülírható: ELEVENLABS_VOICE_<ID>) */
  elevenLabsDefault: string;
};

export const VOICES: VoicePersona[] = [
  { id: "luca", name: "Luca", gender: "female", pitch: 1.08, rate: 1.0, elevenLabsDefault: "EXAVITQu4vr4xnSDxMaL" },
  { id: "dora", name: "Dóra", gender: "female", pitch: 0.96, rate: 0.96, elevenLabsDefault: "XB0fDUnXU5powFXDhCwa" },
  { id: "bence", name: "Bence", gender: "male", pitch: 0.92, rate: 0.97, elevenLabsDefault: "onwK4e9ZLuTAKqWW03F9" },
  { id: "mate", name: "Máté", gender: "male", pitch: 1.02, rate: 1.05, elevenLabsDefault: "nPczCjzI2devNBz1zQrb" },
];

export const getVoice = (id: VoiceId) => VOICES.find((v) => v.id === id) ?? VOICES[0];
