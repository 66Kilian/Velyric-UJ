"use client";

import { Info, Pause, Play, RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { TextField } from "@/components/auth/Fields";
import { cn } from "@/lib/cn";
import { requestMessages, speak, stopSpeaking, type SpeakMode } from "@/lib/onboarding/client";
import type { OnboardingData } from "@/lib/onboarding/schema";
import { VOICES, getVoice } from "@/lib/onboarding/voices";
import type { StepProps } from "../types";
import { ChoiceCard, Section, TextArea, VoiceBars } from "../ui";

type Locale = "hu" | "en" | "de";

// Névcsere a szövegekben, ha az ügynök neve változik (MI-hívás nélkül)
const swapName = (text: string, from: string, to: string) =>
  from && to && from !== to ? text.split(from).join(to) : text;

// 3. LÉPÉS – hang, ki szól először, megszólítás, név, köszönés és köszönő üzenet (meghallgathatóan)
export function VoiceStep({ data, update, showErrors, onSpeaking }: StepProps & {
  showErrors: boolean;
  onSpeaking: (speaking: boolean) => void;
}) {
  const t = useTranslations("setup.voice");
  const locale = useLocale() as Locale;
  const [playing, setPlaying] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [mode, setMode] = useState<SpeakMode | null>(null);
  const [instruction, setInstruction] = useState("");
  const [writing, setWriting] = useState(false);
  const { voice } = data;

  useEffect(() => () => stopSpeaking(), []);
  useEffect(() => onSpeaking(playing !== null), [playing, onSpeaking]);

  const play = async (key: string, text: string, voiceId = voice.id) => {
    if (playing === key) {
      stopSpeaking();
      setPlaying(null);
      return;
    }
    if (!text.trim()) return;
    setLoadingKey(key);
    const used = await speak(text, voiceId, locale, () => setPlaying((p) => (p === key ? null : p)));
    setLoadingKey(null);
    setMode(used);
    setPlaying(key);
  };

  const regenerate = async (next: OnboardingData["voice"], extra = "") => {
    setWriting(true);
    try {
      const result = await requestMessages({
        action: "messages",
        locale,
        businessName: data.profile?.businessName || data.business.name,
        summary: data.profile?.summary ?? "",
        industry: data.profile?.industry ?? "other",
        agentName: next.agentName || getVoice(next.id).name,
        formality: next.formality,
        firstSpeaker: next.firstSpeaker,
        tasks: data.tasks.filter((x) => x.enabled).map((x) => x.label),
        instruction: extra,
      });
      update((d) => ({ ...d, voice: { ...d.voice, greeting: result.greeting, closing: result.closing } }));
    } catch {
      // Marad az előző szöveg – a felhasználó kézzel is átírhatja
    } finally {
      setWriting(false);
    }
  };

  const setVoice = (patch: Partial<OnboardingData["voice"]>, rewrite = false) => {
    const next = { ...voice, ...patch };
    update((d) => ({ ...d, voice: next }));
    if (rewrite) void regenerate(next);
  };

  // Hangválasztás: ha a név még a korábbi hang neve volt, az új hang nevét veszi fel
  const chooseVoice = (id: OnboardingData["voice"]["id"]) => {
    const prevName = getVoice(voice.id).name;
    const nextName = getVoice(id).name;
    const rename = voice.agentName === prevName;
    setVoice({
      id,
      ...(rename && {
        agentName: nextName,
        greeting: swapName(voice.greeting, prevName, nextName),
        closing: swapName(voice.closing, prevName, nextName),
      }),
    });
  };

  const previewFor = (id: OnboardingData["voice"]["id"]) =>
    voice.agentName === getVoice(voice.id).name ? swapName(voice.greeting, voice.agentName, getVoice(id).name) : voice.greeting;

  return (
    <div className="flex flex-col gap-10">
      {/* ---- Hangok ---- */}
      <div className="grid gap-3 sm:grid-cols-2">
        {VOICES.map((persona) => {
          const key = `voice-${persona.id}`;
          const isPlaying = playing === key;
          return (
            <ChoiceCard
              key={persona.id}
              name="voice"
              value={persona.id}
              selected={voice.id === persona.id}
              onSelect={() => chooseVoice(persona.id)}
              icon={
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-11 items-center justify-center rounded-full text-base font-bold",
                    voice.id === persona.id ? "bg-cta text-white" : "bg-raised text-ink",
                  )}
                >
                  {persona.name[0]}
                </span>
              }
              title={
                <span className="flex flex-col">
                  <span className="text-lg">{persona.name}</span>
                  <span className="text-xs font-medium text-muted">{t(persona.gender)}</span>
                </span>
              }
              footer={
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted">{t(`personas.${persona.id}`)}</span>
                <button
                  type="button"
                  onClick={() => void play(key, previewFor(persona.id), persona.id)}
                  aria-label={`${isPlaying ? t("stop") : t("play")}: ${persona.name}`}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line-strong bg-canvas/70 px-3.5 text-xs font-semibold transition-colors hover:border-ink/30"
                >
                  {loadingKey === key ? (
                    <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                  ) : isPlaying ? (
                    <Pause className="size-3.5 fill-current" aria-hidden="true" />
                  ) : (
                    <Play className="size-3.5 fill-current" aria-hidden="true" />
                  )}
                  {isPlaying ? <VoiceBars active /> : t("play")}
                </button>
              </span>
              }
            />
          );
        })}
      </div>
      {mode === "browser" && (
        <p className="-mt-7 flex items-start gap-2 text-xs leading-relaxed text-muted">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {t("previewNote")}
        </p>
      )}

      {/* ---- Ki szól először, megszólítás ---- */}
      <div className="grid gap-8 lg:grid-cols-2">
        <Section title={t("firstTitle")}>
          <div className="grid gap-3">
            {(["agent", "caller"] as const).map((who) => (
              <ChoiceCard
                key={who}
                name="first"
                value={who}
                selected={voice.firstSpeaker === who}
                onSelect={() => setVoice({ firstSpeaker: who }, true)}
                title={t(`first.${who}.title`)}
                text={t(`first.${who}.text`)}
              />
            ))}
          </div>
        </Section>
        <Section title={t("formalityTitle")}>
          <div className="grid gap-3">
            {(["formal", "informal"] as const).map((f) => (
              <ChoiceCard
                key={f}
                name="formality"
                value={f}
                selected={voice.formality === f}
                onSelect={() => setVoice({ formality: f }, true)}
                title={t(`formality.${f}.title`)}
                text={t(`formality.${f}.text`)}
              />
            ))}
          </div>
        </Section>
      </div>

      {/* ---- Név, köszönés, zárás ---- */}
      <Section title={t("agentName")} text={t("agentNameHint")}>
        <div className="max-w-xs">
          <TextField
            label={t("agentName")}
            className="[&>label]:sr-only"
            value={voice.agentName}
            maxLength={40}
            onChange={(e) => {
              const name = e.target.value;
              update((d) => ({
                ...d,
                voice: {
                  ...d.voice,
                  agentName: name,
                  greeting: name.trim().length >= 2 ? swapName(d.voice.greeting, d.voice.agentName, name) : d.voice.greeting,
                  closing: name.trim().length >= 2 ? swapName(d.voice.closing, d.voice.agentName, name) : d.voice.closing,
                },
              }));
            }}
          />
        </div>
      </Section>

      <div className={cn("flex flex-col gap-6 transition-opacity", writing && "pointer-events-none opacity-60")} aria-busy={writing}>
        <MessageField
          label={t("greeting")}
          value={voice.greeting}
          onChange={(greeting) => update((d) => ({ ...d, voice: { ...d.voice, greeting } }))}
          playing={playing === "greeting"}
          loading={loadingKey === "greeting"}
          onPlay={() => play("greeting", voice.greeting)}
          playLabel={t("play")}
          stopLabel={t("stop")}
          error={showErrors && !voice.greeting.trim() ? t("greetingRequired") : null}
        />
        <MessageField
          label={t("closing")}
          value={voice.closing}
          onChange={(closing) => update((d) => ({ ...d, voice: { ...d.voice, closing } }))}
          playing={playing === "closing"}
          loading={loadingKey === "closing"}
          onPlay={() => play("closing", voice.closing)}
          playLabel={t("play")}
          stopLabel={t("stop")}
        />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void regenerate(voice, instruction.trim());
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            maxLength={200}
            placeholder={t("instructionPlaceholder")}
            aria-label={t("instructionPlaceholder")}
            className="h-12 flex-1 rounded-xl border border-line-strong bg-canvas/70 px-4 text-[16px] text-ink outline-none placeholder:text-muted/55 focus:border-brand-pink/70"
          />
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface px-5 text-ui font-semibold transition-colors hover:bg-raised"
          >
            <RefreshCw className={cn("size-4", writing && "animate-spin")} aria-hidden="true" />
            {writing ? t("regenerating") : t("regenerate")}
          </button>
        </form>
      </div>

      <p className="flex items-start gap-2.5 rounded-xl border border-line bg-canvas/40 p-4 text-sm leading-relaxed text-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden="true" />
        {t("aiNote")}
      </p>
    </div>
  );
}

function MessageField({
  label,
  value,
  onChange,
  playing,
  loading,
  onPlay,
  playLabel,
  stopLabel,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  playing: boolean;
  loading: boolean;
  onPlay: () => void;
  playLabel: string;
  stopLabel: string;
  error?: string | null;
}) {
  return (
    <TextArea
      label={label}
      rows={2}
      maxLength={400}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      aside={
        <button
          type="button"
          onClick={onPlay}
          disabled={!value.trim()}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line-strong bg-canvas/70 px-3.5 text-xs font-semibold transition-colors hover:border-ink/30 disabled:opacity-50"
        >
          {loading ? (
            <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
          ) : playing ? (
            <Pause className="size-3.5 fill-current" aria-hidden="true" />
          ) : (
            <Play className="size-3.5 fill-current" aria-hidden="true" />
          )}
          {playing ? <VoiceBars active /> : playLabel}
          <span className="sr-only">{playing ? stopLabel : ""}</span>
        </button>
      }
    />
  );
}
