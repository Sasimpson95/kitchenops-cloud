export type ToastTone = "success" | "error" | "warning" | "info";

export type ToastPayload = {
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
};

const TOAST_EVENT = "kitchenops:toast";

export function showToast(payload: ToastPayload): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastPayload>(TOAST_EVENT, { detail: payload }));
}

export const toast = {
  success(title: string, description?: string): void {
    showToast({ title, description, tone: "success" });
  },
  error(title: string, description?: string): void {
    showToast({ title, description, tone: "error", duration: 6500 });
  },
  warning(title: string, description?: string): void {
    showToast({ title, description, tone: "warning", duration: 5500 });
  },
  info(title: string, description?: string): void {
    showToast({ title, description, tone: "info" });
  },
};

export { TOAST_EVENT };
