import { useQuery, useMutation } from "@tanstack/react-query";
import { CategoryManagement } from "@/components/CategoryManagement";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category } from "@shared/schema";

interface CategoryWithSpending {
  id: string;
  name: string;
  icon: string;
  totalSpent: number;
}

export default function Categories() {
  const { data: dbCategories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: categorySpending = [] } = useQuery<{ categoryId: number; name: string; total: number }[]>({
    queryKey: ["/api/analytics/category-spending"],
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; icon: string }) => {
      return apiRequest("POST", "/api/categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, name, icon }: { id: string; name: string; icon: string }) => {
      return apiRequest("PUT", `/api/categories/${id}`, { name, icon });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
  });

  const spendingMap = new Map(categorySpending.map(s => [s.categoryId, s.total]));

  const categories: CategoryWithSpending[] = dbCategories.map(c => ({
    id: c.id.toString(),
    name: c.name,
    icon: c.icon,
    totalSpent: Number(spendingMap.get(c.id) || 0),
  }));

  const handleAddCategory = (name: string, icon: string) => {
    createCategoryMutation.mutate({ name, icon });
  };

  const handleEditCategory = (id: string, name: string, icon: string) => {
    updateCategoryMutation.mutate({ id, name, icon });
  };

  const handleDeleteCategory = (id: string) => {
    deleteCategoryMutation.mutate(id);
  };

  return (
    <div className="space-y-6" data-testid="categories-page">
      <div>
        <h1 className="text-3xl font-bold">Categories</h1>
        <p className="text-muted-foreground">
          Manage your expense categories
        </p>
      </div>

      {categoriesLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <CategoryManagement
          categories={categories}
          onAdd={handleAddCategory}
          onEdit={handleEditCategory}
          onDelete={handleDeleteCategory}
        />
      )}
    </div>
  );
}
