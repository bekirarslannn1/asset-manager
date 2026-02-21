import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: string | number): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(num);
}

export function getSessionId(): string {
  let sid = localStorage.getItem("session_id");
  if (!sid) {
    sid = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem("session_id", sid);
  }
  return sid;
}

export function discountPercent(price: string | number, compare: string | number): number {
  const p = typeof price === "string" ? parseFloat(price) : price;
  const c = typeof compare === "string" ? parseFloat(compare) : compare;
  if (!c || c <= p) return 0;
  return Math.round(((c - p) / c) * 100);
}
