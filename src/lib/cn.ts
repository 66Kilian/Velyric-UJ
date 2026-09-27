import { clsx, type ClassValue } from "clsx";

// Osztálynevek feltételes összefűzése
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
