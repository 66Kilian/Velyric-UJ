import type { OnboardingData } from "@/lib/onboarding/schema";

export type Update = (fn: (draft: OnboardingData) => OnboardingData) => void;

export type StepProps = {
  data: OnboardingData;
  update: Update;
  /** Az MI elérhető-e (különben sablonok) */
  aiMode: "ai" | "template";
  /** Valódi (Supabase) fiók – bemutató módban null */
  userId: string | null;
  goTo: (step: number) => void;
};
