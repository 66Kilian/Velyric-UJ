"use client";

import { CheckCircle2, FileText, Handshake, UploadCloud, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, type DragEvent } from "react";
import { FormAlert } from "@/components/auth/FormAlert";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import {
  ACCEPT_ATTR,
  ACCEPTED_TYPES,
  MAX_FILE_BYTES,
  removeKnowledgeFile,
  uploadKnowledgeFile,
} from "@/lib/onboarding/client";
import type { StepProps } from "../types";
import { TextArea } from "../ui";

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

// 4. LÉPÉS – tudásbázis: fájlok feltöltése, vagy „később küldöm”, nyitvatartás, egyéb tudnivalók
export function KnowledgeStep({ data, update, userId }: StepProps) {
  const t = useTranslations("setup.knowledge");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const k = data.knowledge;

  const setKnowledge = (patch: Partial<typeof k>) => update((d) => ({ ...d, knowledge: { ...d.knowledge, ...patch } }));

  const addFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const problems: string[] = [];
    const files = Array.from(list).slice(0, Math.max(0, 20 - k.files.length));
    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        problems.push(t("tooLarge", { name: file.name }));
        continue;
      }
      if (file.type && !ACCEPTED_TYPES.includes(file.type)) {
        problems.push(t("badType", { name: file.name }));
        continue;
      }
      if (!userId) {
        // Bemutató mód: csak a lista frissül, feltöltés nincs
        update((d) => ({ ...d, knowledge: { ...d.knowledge, files: [...d.knowledge.files, { name: file.name, size: file.size }] } }));
        continue;
      }
      const tempKey = `${file.name}-${file.size}-${Date.now()}`;
      setUploading((u) => [...u, tempKey]);
      try {
        const path = await uploadKnowledgeFile(userId, file);
        update((d) => ({
          ...d,
          knowledge: { ...d.knowledge, files: [...d.knowledge.files, { name: file.name, size: file.size, path: path ?? undefined }] },
        }));
      } catch {
        problems.push(t("uploadFailed", { name: file.name }));
      } finally {
        setUploading((u) => u.filter((x) => x !== tempKey));
      }
    }
    setErrors(problems);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void addFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    const file = k.files[index];
    if (file?.path) void removeKnowledgeFile(file.path);
    update((d) => ({ ...d, knowledge: { ...d.knowledge, files: d.knowledge.files.filter((_, i) => i !== index) } }));
  };

  return (
    <div className="flex flex-col gap-8">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center gap-3 rounded-media border border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-brand-pink bg-brand-pink/10" : "border-line-strong bg-canvas/40",
        )}
      >
        <span className="flex size-14 items-center justify-center rounded-2xl bg-raised">
          <UploadCloud className="size-7 text-accent-ink" aria-hidden="true" />
        </span>
        <p className="font-semibold">
          {t("drop")}{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-accent-ink underline-offset-4 hover:underline"
          >
            {t("browse")}
          </button>
        </p>
        <p className="text-xs text-muted">{t("formats")}</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {!userId && <p className="-mt-5 text-xs text-muted">{t("demoFiles")}</p>}
      {errors.length > 0 && (
        <FormAlert kind="error">
          {errors.map((e) => (
            <span key={e} className="block">
              {e}
            </span>
          ))}
        </FormAlert>
      )}

      {(k.files.length > 0 || uploading.length > 0) && (
        <ul className="-mt-3 flex flex-col gap-2">
          {k.files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-line bg-canvas/50 px-4 py-3">
              <FileText className="size-5 shrink-0 text-muted" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{file.name}</span>
              <span className="tabular shrink-0 text-xs text-muted">{formatSize(file.size)}</span>
              <CheckCircle2 className="size-4 shrink-0 text-success" aria-label={t("uploaded")} />
              <button
                type="button"
                onClick={() => removeFile(i)}
                aria-label={`${t("remove")}: ${file.name}`}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-raised hover:text-ink"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
          {uploading.map((key) => (
            <li key={key} className="flex items-center gap-3 rounded-xl border border-line bg-canvas/50 px-4 py-3 text-sm text-muted" role="status">
              <Spinner className="size-4" /> {t("uploading")}
            </li>
          ))}
        </ul>
      )}

      <label
        className={cn(
          "flex cursor-pointer items-start gap-4 rounded-panel border p-5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent-ink",
          k.later ? "border-brand shadow-lift" : "border-line-strong bg-canvas/40 hover:border-ink/25",
        )}
      >
        <input
          type="checkbox"
          checked={k.later}
          onChange={(e) => setKnowledge({ later: e.target.checked })}
          className="mt-1 size-5 shrink-0 accent-[#ff007a]"
        />
        <span className="flex-1">
          <span className="flex items-center gap-2 font-semibold">
            <Handshake className="size-5 text-accent-ink" aria-hidden="true" />
            {t("laterTitle")}
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-muted">{t("laterText")}</span>
        </span>
      </label>

      <div className="grid gap-5 lg:grid-cols-2">
        <TextArea
          label={t("hours")}
          rows={3}
          maxLength={400}
          placeholder={t("hoursPlaceholder")}
          value={k.hours}
          onChange={(e) => setKnowledge({ hours: e.target.value })}
        />
        <TextArea
          label={t("notes")}
          rows={3}
          maxLength={2000}
          placeholder={t("notesPlaceholder")}
          value={k.notes}
          onChange={(e) => setKnowledge({ notes: e.target.value })}
        />
      </div>
      <p className="text-sm text-muted">{t("empty")}</p>
    </div>
  );
}
