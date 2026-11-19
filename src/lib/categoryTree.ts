export type CatalogCategory = {
  id: string;
  slug: string;
  parent_id: string | null;
};

export const getCategoryTreeIds = (categories: readonly CatalogCategory[], slug: string) => {
  if (!slug) return [];

  const root = categories.find((category) => category.slug === slug);
  if (!root) return [];

  const ids = new Set([root.id]);
  for (const parentId of ids) {
    for (const category of categories) {
      if (category.parent_id === parentId) ids.add(category.id);
    }
  }
  return Array.from(ids);
};
