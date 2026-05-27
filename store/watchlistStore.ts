import { create } from "zustand";

export type WatchlistStatus = "BUY" | "STRETCH" | "WAIT" | "SKIP";

export interface WatchlistItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  category: string;
  imageColor: string;
  status: WatchlistStatus;
  projectedWears: number;
  note: string;
}

export function getProjectedCpw(price: number, wears: number): number {
  return wears > 0 ? price / wears : price;
}

export function getVerdict(cpw: number): WatchlistStatus {
  if (cpw <= 10) return "BUY";
  if (cpw <= 25) return "STRETCH";
  if (cpw <= 60) return "WAIT";
  return "SKIP";
}

export const VERDICT_COLORS: Record<WatchlistStatus, string> = {
  BUY: "#4A7C59",
  STRETCH: "#9B7A2E",
  WAIT: "#C4503A",
  SKIP: "#8A8070",
};

export const VERDICT_TEXTS: Record<WatchlistStatus, string> = {
  BUY: "A no-brainer. Add it now.",
  STRETCH: "A reach, but workable.",
  WAIT: "Worth reconsidering.",
  SKIP: "Skip it. Not worth the cost basis.",
};

const MOCK_ITEMS: WatchlistItem[] = [
  {
    id: "wl-1",
    name: "The Row · Margaux 15",
    brand: "THE ROW",
    price: 5290,
    category: "LEATHER",
    imageColor: "#2A2018",
    status: "WAIT",
    projectedWears: 240,
    note: "projected workhorse · 240 wears = $22/wear",
  },
  {
    id: "wl-2",
    name: "Bottega Cassette",
    brand: "BOTTEGA",
    price: 3500,
    category: "LEATHER",
    imageColor: "#1E1810",
    status: "STRETCH",
    projectedWears: 140,
    note: "evening only · risk underuse",
  },
  {
    id: "wl-3",
    name: "Lemaire Croissant Hobo",
    brand: "LEMAIRE",
    price: 1690,
    category: "LEATHER",
    imageColor: "#C4A882",
    status: "BUY",
    projectedWears: 320,
    note: "daily bag · pays off in 8 mo",
  },
  {
    id: "wl-4",
    name: "Khaite Wallace Jeans",
    brand: "KHAITE",
    price: 540,
    category: "DENIM",
    imageColor: "#2A3F5C",
    status: "BUY",
    projectedWears: 160,
    note: "denim base · 3-4× / wk",
  },
  {
    id: "wl-5",
    name: "Manolo Blahnik Hangisi",
    brand: "MANOLO",
    price: 1095,
    category: "SHOES",
    imageColor: "#C8B8E8",
    status: "SKIP",
    projectedWears: 18,
    note: "wedding-only · $60.83/wear",
  },
];

interface WatchlistState {
  items: WatchlistItem[];
  addItem: (item: Omit<WatchlistItem, "id">) => void;
  updateWears: (id: string, projectedWears: number) => void;
  removeItem: (id: string) => void;
}

export const useWatchlistStore = create<WatchlistState>((set) => ({
  items: MOCK_ITEMS,
  addItem: (item) =>
    set((state) => ({
      items: [...state.items, { ...item, id: `wl-${Date.now()}` }],
    })),
  updateWears: (id, projectedWears) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id
          ? { ...i, projectedWears, status: getVerdict(getProjectedCpw(i.price, projectedWears)) }
          : i
      ),
    })),
  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
}));
