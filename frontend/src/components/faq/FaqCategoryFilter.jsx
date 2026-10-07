export const FaqCategoryFilter = ({
  categories = [],
  activeCategory,
  onSelectCategory,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 ${
              isActive
                ? 'bg-blue text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
};
