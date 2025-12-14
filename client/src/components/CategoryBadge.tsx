import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Utensils,
  Car,
  Home,
  Zap,
  Film,
  Heart,
  GraduationCap,
  Plane,
  MoreHorizontal,
} from "lucide-react";

const categoryConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  groceries: { icon: <ShoppingCart className="h-3 w-3" />, color: "bg-chart-1/15 text-chart-1" },
  food: { icon: <Utensils className="h-3 w-3" />, color: "bg-chart-4/15 text-chart-4" },
  transport: { icon: <Car className="h-3 w-3" />, color: "bg-chart-2/15 text-chart-2" },
  housing: { icon: <Home className="h-3 w-3" />, color: "bg-chart-3/15 text-chart-3" },
  utilities: { icon: <Zap className="h-3 w-3" />, color: "bg-chart-5/15 text-chart-5" },
  entertainment: { icon: <Film className="h-3 w-3" />, color: "bg-chart-3/15 text-chart-3" },
  health: { icon: <Heart className="h-3 w-3" />, color: "bg-destructive/15 text-destructive" },
  education: { icon: <GraduationCap className="h-3 w-3" />, color: "bg-chart-2/15 text-chart-2" },
  travel: { icon: <Plane className="h-3 w-3" />, color: "bg-chart-1/15 text-chart-1" },
  other: { icon: <MoreHorizontal className="h-3 w-3" />, color: "bg-muted text-muted-foreground" },
};

interface CategoryBadgeProps {
  category: string;
  size?: "sm" | "default";
}

export function CategoryBadge({ category, size = "default" }: CategoryBadgeProps) {
  const config = categoryConfig[category.toLowerCase()] || categoryConfig.other;
  
  return (
    <Badge
      variant="secondary"
      className={`${config.color} ${size === "sm" ? "text-xs" : ""} gap-1`}
      data-testid={`badge-category-${category.toLowerCase()}`}
    >
      {config.icon}
      <span className="capitalize">{category}</span>
    </Badge>
  );
}

export function getCategoryIcon(category: string) {
  return categoryConfig[category.toLowerCase()]?.icon || categoryConfig.other.icon;
}

export const defaultCategories = Object.keys(categoryConfig);
