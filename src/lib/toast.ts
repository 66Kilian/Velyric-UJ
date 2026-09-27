// Pici, függőség nélküli toast-tároló: bárhonnan hívható (toast.success("…"))
export type Toast = { id: number; kind: "success" | "error"; message: string };

type Listener = (toasts: Toast[]) => void;
let toasts: Toast[] = [];
const listeners = new Set<Listener>();
let nextId = 1;

const emit = () => listeners.forEach((l) => l(toasts));

function push(kind: Toast["kind"], message: string) {
  const id = nextId++;
  toasts = [...toasts, { id, kind, message }];
  emit();
  setTimeout(() => dismiss(id), 4500);
}

export function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  listener(toasts);
  return () => {
    listeners.delete(listener);
  };
}

export const toast = {
  success: (message: string) => push("success", message),
  error: (message: string) => push("error", message),
};
