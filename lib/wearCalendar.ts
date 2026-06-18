import { t } from "@/lib/i18n";
import type { ItemWithWears } from "@/lib/database.types";

export const MONTH_SHORT = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

// Head-to-toe display order for an outfit: accessories/outerwear up top,
// shoes always last at the bottom — mirrors how a flat-lay reads visually.
export const OUTFIT_CATEGORY_ORDER = [
  "accessories",
  "outerwear",
  "tops",
  "knitwear",
  "dresses",
  "skirts",
  "pants",
  "denim",
  "bags",
  "shoes",
];

export function todayDs(): string {
  return new Date().toISOString().split("T")[0];
}

export function buildWearsByDate(items: ItemWithWears[]): Record<string, ItemWithWears[]> {
  const map: Record<string, ItemWithWears[]> = {};
  items.forEach((item) => {
    item.wears.forEach((w) => {
      if (!map[w.worn_at]) map[w.worn_at] = [];
      if (!map[w.worn_at].some((i) => i.id === item.id)) map[w.worn_at].push(item);
    });
  });
  return map;
}

export function outfitRank(item: ItemWithWears): number {
  const idx = OUTFIT_CATEGORY_ORDER.indexOf(item.category ?? "");
  return idx === -1 ? Math.floor(OUTFIT_CATEGORY_ORDER.length / 2) : idx;
}

export function sortForOutfit(items: ItemWithWears[]): ItemWithWears[] {
  return [...items].sort((a, b) => outfitRank(a) - outfitRank(b));
}

export function formatDayLabel(ds: string): string {
  const d = new Date(ds + "T00:00:00");
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isToday = ds === todayDs();
  const isYesterday = ds === yesterday.toISOString().split("T")[0];

  if (isToday) return `${t("calToday")} · ${MONTH_SHORT[d.getMonth()]} · ${String(d.getDate()).padStart(2, "0")}`;
  if (isYesterday) return `${t("calYesterday")} · ${MONTH_SHORT[d.getMonth()]} · ${String(d.getDate()).padStart(2, "0")}`;
  return `${d.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()} · ${MONTH_SHORT[d.getMonth()]} · ${String(d.getDate()).padStart(2, "0")}`;
}

// CPW earned for a set of items worn on a given day: sum of price/(n*(n-1)) per item
export function earnedForDay(items: ItemWithWears[]): number {
  return items.reduce((sum, item) => {
    const n = item.wears.length;
    return n > 1 ? sum + item.price / (n * (n - 1)) : sum;
  }, 0);
}
