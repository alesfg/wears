import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { WatchlistItemRow, WatchlistItemInsert } from "@/lib/database.types";

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

function fromRow(row: WatchlistItemRow): WatchlistItem {
  const cpw = getProjectedCpw(row.price, row.projected_wears);
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? "",
    price: row.price,
    category: row.category ?? "",
    imageColor: row.image_color,
    status: getVerdict(cpw),
    projectedWears: row.projected_wears,
    note: row.note ?? "",
  };
}

interface WatchlistState {
  items: WatchlistItem[];
  isLoading: boolean;
  error: string | null;

  fetchItems: (userId: string) => Promise<void>;
  addItem: (
    item: Omit<WatchlistItem, "id" | "status">,
    userId: string
  ) => Promise<void>;
  updateWears: (id: string, projectedWears: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  reset: () => void;
}

export const useWatchlistStore = create<WatchlistState>((set) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async (userId) => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase
      .from("watchlist_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      set({ error: error.message, isLoading: false });
      return;
    }

    set({ items: (data ?? []).map(fromRow), isLoading: false });
  },

  addItem: async (item, userId) => {
    const insert: WatchlistItemInsert = {
      user_id: userId,
      name: item.name,
      brand: item.brand || null,
      category: item.category || null,
      price: item.price,
      image_color: item.imageColor,
      projected_wears: item.projectedWears,
      note: item.note || null,
    };

    const { data, error } = await supabase
      .from("watchlist_items")
      .insert(insert)
      .select()
      .single();

    if (error || !data) return;

    set((state) => ({ items: [fromRow(data), ...state.items] }));
  },

  updateWears: async (id, projectedWears) => {
    const { error } = await supabase
      .from("watchlist_items")
      .update({ projected_wears: projectedWears })
      .eq("id", id);

    if (error) return;

    set((state) => ({
      items: state.items.map((i) =>
        i.id === id
          ? {
              ...i,
              projectedWears,
              status: getVerdict(getProjectedCpw(i.price, projectedWears)),
            }
          : i
      ),
    }));
  },

  removeItem: async (id) => {
    const { error } = await supabase.from("watchlist_items").delete().eq("id", id);
    if (error) return;

    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
  },

  reset: () => set({ items: [], isLoading: false, error: null }),
}));
