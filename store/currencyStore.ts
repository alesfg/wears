import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isEs } from "@/lib/i18n";

export type CurrencySymbol = "$" | "€";

const CURRENCY_KEY = "@wears/currency_symbol";

interface CurrencyState {
  symbol: CurrencySymbol;
  setSymbol: (symbol: CurrencySymbol) => void;
  init: () => Promise<void>;
}

// Default: € for Spanish-language devices, $ otherwise — until the user
// picks one explicitly in Settings, at which point it's persisted.
export const useCurrencyStore = create<CurrencyState>((set) => ({
  symbol: isEs ? "€" : "$",
  setSymbol: (symbol) => {
    set({ symbol });
    AsyncStorage.setItem(CURRENCY_KEY, symbol).catch(() => {});
  },
  init: async () => {
    const saved = await AsyncStorage.getItem(CURRENCY_KEY);
    if (saved === "$" || saved === "€") set({ symbol: saved });
  },
}));
