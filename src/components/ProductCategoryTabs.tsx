type CategoryOption = { slug: string; label: string };

type ProductCategoryTabsProps = {
  categories: readonly CategoryOption[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
};

const ProductCategoryTabs = ({ categories, selectedSlug, onSelect }: ProductCategoryTabsProps) => (
  <div role="group" aria-label="فلترة حسب القسم" className="-mx-4 overflow-x-auto px-4 py-1">
    <div className="mx-auto flex w-max items-center gap-1.5 sm:gap-2.5">
      {[{ slug: "", label: "الكل" }, ...categories].map(({ slug, label }) => (
        <button
          key={slug}
          type="button"
          aria-pressed={selectedSlug === slug}
          onClick={() => onSelect(slug)}
          className={`min-h-10 shrink-0 whitespace-nowrap rounded-full px-3.5 text-xs font-medium transition-colors sm:px-5 sm:text-sm ${selectedSlug === slug ? "bg-burgundy text-white" : "text-[#282020] hover:bg-burgundy-soft"}`}
        >
          {label}
        </button>
      ))}
    </div>
  </div>
);

export default ProductCategoryTabs;
