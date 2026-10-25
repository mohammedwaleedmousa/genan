import { useStore } from "@/store/useStore";

// Genan storefront prices are authored in Saudi Riyals. Customer-facing prices,
// carts and checkout must always use SAR, regardless of previously saved settings
// or additional currency records maintained in the admin database.
export type CurrencyMode = string;

export interface CurrencyMeta {
  rate: number;
  symbol: string;
  label: string;
  short: string;
  isBase?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

const SAR_META: CurrencyMeta = {
  rate: 1,
  symbol: "ر.س",
  label: "ريال سعودي",
  short: "SAR",
  isBase: true,
  isActive: true,
  sortOrder: 1,
};

export const CURRENCY_RATES: Record<string, CurrencyMeta> = { SAR: SAR_META };

// Retain this public API for callers at app startup. No currency table query
// or exchange-rate hydration is needed when the storefront has one currency.
export async function hydrateCurrencies(_force = false): Promise<void> {
  if (useStore.getState().currencyMode !== "SAR") {
    useStore.getState().setCurrencyMode("SAR");
  }
}

export function getActiveCurrencies(): Array<{ code: string; meta: CurrencyMeta }> {
  return [{ code: "SAR", meta: SAR_META }];
}

export function getRateSnapshot(_mode: CurrencyMode): number {
  return 1;
}

export const convertPrice = (baseSAR: number, _mode: CurrencyMode): number =>
  Math.round(Number(baseSAR || 0) * 100) / 100;

export const formatPrice = (baseSAR: number, mode: CurrencyMode): string =>
  `${convertPrice(baseSAR, mode).toLocaleString("en-US")} ${SAR_META.symbol}`;

export const useCurrency = () => {
  const setMode = useStore((s) => s.setCurrencyMode);
  return {
    mode: "SAR" as CurrencyMode,
    setMode,
    symbol: SAR_META.symbol,
    label: SAR_META.label,
    short: SAR_META.short,
    format: (base: number) => formatPrice(base, "SAR"),
    convert: (base: number) => convertPrice(base, "SAR"),
  };
};
