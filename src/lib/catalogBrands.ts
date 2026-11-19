export const CATALOG_BRAND_SELECT = "catalog_brand:brands!products_brand_id_fkey(name,slug)";

export type ProductBrandRow = {
  brand?: string | null;
  brand_id?: string | null;
  catalog_brand?: { name: string; slug: string | null } | null;
};

type BrandOption = { value: string; label: string };
const brandKey = (value?: string | null) => value?.trim().normalize("NFKC").toLowerCase().replace(/\s+/g, " ") || "";

export const getProductBrand = (row: ProductBrandRow) => ({
  name: row.catalog_brand?.name.trim() || row.brand?.trim() || "",
  slug: row.catalog_brand?.slug?.trim() || undefined,
});

export const getCatalogBrandOptions = (rows: readonly ProductBrandRow[]): BrandOption[] => {
  const options = new Map<string, BrandOption>();
  for (const row of rows) {
    const { name, slug } = getProductBrand(row);
    const key = brandKey(name);
    if (key && (!options.has(key) || slug)) options.set(key, { value: slug || key, label: name });
  }
  return [...options.values()].sort((a, b) => a.label.localeCompare(b.label, "ar"));
};

export const getCatalogBrandFilter = (options: readonly BrandOption[], value: string) => {
  const key = brandKey(value);
  return options.find((option) => brandKey(option.value) === key || brandKey(option.label) === key);
};

export const matchesCatalogBrand = (row: ProductBrandRow, value: string, option?: BrandOption) => {
  if (value === "all") return true;
  const { name, slug } = getProductBrand(row);
  const key = brandKey(value);
  if (!key) return false;
  if ([name, slug, row.brand_id].some((candidate) => brandKey(candidate) === key)) return true;
  return !slug && Boolean(option && brandKey(name) === brandKey(option.label));
};

export const catalogBrandHref = (brand: string) => `/products?${new URLSearchParams({ brand })}`;
