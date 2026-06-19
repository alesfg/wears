export const TIERS = [
  { name: "investment", maxCpw: Infinity, label: "$$$" },
  { name: "luxury", maxCpw: 80, label: "≤ $80/wear" },
  { name: "normal", maxCpw: 25, label: "≤ $25/wear" },
  { name: "workhorse", maxCpw: 10, label: "≤ $10/wear" },
  { name: "free basically", maxCpw: 2, label: "≤ $2/wear" },
] as const;

export type TierName = (typeof TIERS)[number]["name"];

export function getTier(cpw: number): TierName {
  if (cpw <= 2) return "free basically";
  if (cpw <= 10) return "workhorse";
  if (cpw <= 25) return "normal";
  if (cpw <= 80) return "luxury";
  return "investment";
}

export function isProfitable(cpw: number): boolean {
  return cpw <= 25;
}

export const FREE_TIER_ITEM_LIMIT = 30;

export const OCCASIONS = [
  "office",
  "wfh",
  "gym",
  "date night",
  "dinner",
  "errand",
  "travel",
  "gallery",
  "event",
  "casual",
  "other",
] as const;

export const CATEGORIES = [
  "outerwear",
  "knitwear",
  "denim",
  "tops",
  "dresses",
  "skirts",
  "pants",
  "shoes",
  "bags",
  "accessories",
] as const;
