import { useState } from "react";
import { CategoryManagement } from "@/components/CategoryManagement";

// todo: remove mock functionality
const initialCategories = [
  { id: "1", name: "Groceries", icon: "Shopping", totalSpent: 450.00 },
  { id: "2", name: "Dining Out", icon: "Food", totalSpent: 320.50 },
  { id: "3", name: "Transport", icon: "Transport", totalSpent: 280.00 },
  { id: "4", name: "Housing", icon: "Home", totalSpent: 1500.00 },
  { id: "5", name: "Utilities", icon: "Utilities", totalSpent: 180.00 },
  { id: "6", name: "Entertainment", icon: "Entertainment", totalSpent: 120.00 },
  { id: "7", name: "Healthcare", icon: "Health", totalSpent: 95.00 },
  { id: "8", name: "Education", icon: "Education", totalSpent: 250.00 },
];

export default function Categories() {
  const [categories, setCategories] = useState(initialCategories);

  const handleAddCategory = (name: string, icon: string) => {
    const newCategory = {
      id: Date.now().toString(),
      name,
      icon,
      totalSpent: 0,
    };
    setCategories((prev) => [...prev, newCategory]);
  };

  const handleEditCategory = (id: string, name: string, icon: string) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, name, icon } : cat))
    );
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
  };

  return (
    <div className="space-y-6" data-testid="categories-page">
      <div>
        <h1 className="text-3xl font-bold">Categories</h1>
        <p className="text-muted-foreground">
          Manage your expense categories
        </p>
      </div>

      <CategoryManagement
        categories={categories}
        onAdd={handleAddCategory}
        onEdit={handleEditCategory}
        onDelete={handleDeleteCategory}
      />
    </div>
  );
}
