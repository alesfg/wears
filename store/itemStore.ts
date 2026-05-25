import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { getTier, isProfitable } from "@/constants/config";
import type { Item, Wear, ItemWithWears, ItemInsert, WearInsert } from "@/lib/database.types";

interface ItemState {
  items: ItemWithWears[];
  isLoading: boolean;
  error: string | null;

  fetchItems: (userId: string) => Promise<void>;
  addItem: (item: ItemInsert, userId: string) => Promise<Item | null>;
  deleteItem: (itemId: string) => Promise<void>;
  logWear: (wear: WearInsert) => Promise<void>;
  deleteWear: (wearId: string, itemId: string) => Promise<void>;
  reset: () => void;
}

function computeCpw(price: number, wearCount: number): number {
  if (wearCount === 0) return price;
  return price / wearCount;
}

function attachCpw(item: Item, wears: Wear[]): ItemWithWears {
  return { ...item, wears, cpw: computeCpw(item.price, wears.length) };
}

export const useItemStore = create<ItemState>((set, _get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const { data: items, error: itemsErr } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (itemsErr) throw itemsErr;
      if (!items) return;

      const { data: wears, error: wearsErr } = await supabase
        .from("wears")
        .select("*")
        .eq("user_id", userId)
        .order("worn_at", { ascending: false });

      if (wearsErr) throw wearsErr;

      const wearsMap: Record<string, Wear[]> = {};
      for (const wear of wears ?? []) {
        if (!wearsMap[wear.item_id]) wearsMap[wear.item_id] = [];
        wearsMap[wear.item_id].push(wear);
      }

      const enriched = items.map((item) =>
        attachCpw(item, wearsMap[item.id] ?? [])
      );

      set({ items: enriched, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  addItem: async (itemData, userId) => {
    const { data, error } = await supabase
      .from("items")
      .insert({ ...itemData, user_id: userId })
      .select()
      .single();

    if (error || !data) return null;

    const newItem = attachCpw(data, []);
    set((s) => ({ items: [newItem, ...s.items] }));
    return data;
  },

  deleteItem: async (itemId) => {
    await supabase.from("items").delete().eq("id", itemId);
    set((s) => ({ items: s.items.filter((i) => i.id !== itemId) }));
  },

  logWear: async (wearData) => {
    const { data, error } = await supabase
      .from("wears")
      .insert(wearData)
      .select()
      .single();

    if (error || !data) return;

    set((s) => ({
      items: s.items.map((item) => {
        if (item.id !== wearData.item_id) return item;
        const newWears = [data, ...item.wears];
        return attachCpw(item, newWears);
      }),
    }));
  },

  deleteWear: async (wearId, itemId) => {
    await supabase.from("wears").delete().eq("id", wearId);
    set((s) => ({
      items: s.items.map((item) => {
        if (item.id !== itemId) return item;
        const newWears = item.wears.filter((w) => w.id !== wearId);
        return attachCpw(item, newWears);
      }),
    }));
  },

  reset: () => set({ items: [], isLoading: false, error: null }),
}));

export { computeCpw, getTier, isProfitable };
