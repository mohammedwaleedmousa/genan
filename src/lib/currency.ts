import { useStore } from "@/store/useStore";
import { supabase } from "@/integrations/supabase/client";

// Base prices are stored in SAR (the base currency). Rates are hydrated from DB at boot.
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

// Mutable cache; overridden by hydrateCurrencies() on boot.
export const CURRENCY_RATES: Record<string, CurrencyMeta> = {
  // Do not fabricate exchange rates when the production database is unreachable.
  // SAR is the pricing base currency; other currencies appear only after database hydration.
  SAR: { rate: 1, symbol: "ر.س", label: "ريال سعودي", short: "SAR", isBase: true, isActive: true, sortOrder: 1 },
};

let hydrated = false;
let hydratePromise: Promise<void> | null = null;

export async function hydrateCurrencies(force = false): Promise<void> {
  if (hydrated && !force) return;
  if (hydratePromise && !force) return hydratePromise;
  hydratePromise = (async () => {
    try {
      const { data, error } = await supabase
        .from("currencies" as any)
        .select("code,name_ar,symbol,rate_to_base,is_base,is_active,sort_order")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      if (Array.isArray(data)) {
        const nextRates: Record<string, CurrencyMeta> = {};
        for (const row of data as any[]) {
          const code = String(row.code || "").trim();
          const rate = Number(row.rate_to_base);
          // Reject invalid and inactive rates rather than silently displaying a 1:1 conversion.
          if (!code || !Number.isFinite(rate) || rate <= 0 || row.is_active === false) continue;
          nextRates[code] = {
            rate,
            symbol: row.symbol || "",
            label: row.name_ar || code,
            short: code,
            isBase: !!row.is_base,
            isActive: true,
            sortOrder: Number(row.sort_order) || 0,
          };
        }
        nextRates.SAR = { rate: 1, symbol: "ر.س", label: "ريال سعودي", short: "SAR", isBase: true, isActive: true, sortOrder: 1 };
        for (const k of Object.keys(CURRENCY_RATES)) delete CURRENCY_RATES[k];
        Object.assign(CURRENCY_RATES, nextRates);
        // Old sessions may carry modes from the deleted database (YER_SOUTH/YER_NORTH).
        // Do not price an order in a currency that the live database does not recognize.
        const currentMode = useStore.getState().currencyMode;
        if (!CURRENCY_RATES[currentMode]) useStore.getState().setCurrencyMode("SAR");
        hydrated = true;
      }
    } catch (e) {
      console.warn("[currency] hydrate failed, using defaults:", e);
    }
  })();
  return hydratePromise;
}

export function getActiveCurrencies(): Array<{ code: string; meta: CurrencyMeta }> {
  return Object.entries(CURRENCY_RATES)
    .filter(([, m]) => m.isActive !== false)
    .sort(([, a], [, b]) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map(([code, meta]) => ({ code, meta }));
}

export function getRateSnapshot(mode: CurrencyMode): number {
  return CURRENCY_RATES[mode]?.rate ?? 1;
}

export const convertPrice = (baseSAR: number, mode: CurrencyMode): number => {
  const rate = (CURRENCY_RATES[mode] ?? CURRENCY_RATES.SAR).rate;
  const value = Number(baseSAR || 0) * rate;
  if (mode === "SAR") return Math.round(value * 100) / 100;
  return Math.round(value);
};

export const formatPrice = (baseSAR: number, mode: CurrencyMode): string => {
  const val = convertPrice(baseSAR, mode);
  const symbol = (CURRENCY_RATES[mode] ?? CURRENCY_RATES.SAR).symbol;
  return `${val.toLocaleString("en-US")} ${symbol}`;
};

export const useCurrency = () => {
  const mode = useStore((s) => s.currencyMode);
  const setMode = useStore((s) => s.setCurrencyMode);
  const meta = CURRENCY_RATES[mode] ?? CURRENCY_RATES.SAR;
  return {
    mode,
    setMode,
    symbol: meta.symbol,
    label: meta.label,
    short: meta.short,
    format: (base: number) => formatPrice(base, mode),
    convert: (base: number) => convertPrice(base, mode),
  };
};