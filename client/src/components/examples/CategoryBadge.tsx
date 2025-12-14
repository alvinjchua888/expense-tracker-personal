import { CategoryBadge, defaultCategories } from "../CategoryBadge";

export default function CategoryBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2">
      {defaultCategories.map((cat) => (
        <CategoryBadge key={cat} category={cat} />
      ))}
    </div>
  );
}
