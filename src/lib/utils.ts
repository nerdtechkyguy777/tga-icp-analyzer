import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function incrementVersion(version: string): string {
  const parts = version.split(".");
  if (parts.length !== 2) return "1.1";
  const major = parseInt(parts[0], 10);
  const minor = parseInt(parts[1], 10);
  return `${major}.${minor + 1}`;
}

/** Accepts domain-only (konecranes.com) or full URL — always returns https URL */
export function normalizeCompanyUrl(input: string): string {
  let url = input.trim();
  if (!url) return url;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
}

export function isValidCompanyUrl(input: string): boolean {
  try {
    const normalized = normalizeCompanyUrl(input);
    const parsed = new URL(normalized);
    return Boolean(parsed.hostname && parsed.hostname.includes("."));
  } catch {
    return false;
  }
}
