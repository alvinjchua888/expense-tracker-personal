import { CategoryManagement } from "../CategoryManagement";

export default function CategoryManagementExample() {
  // todo: remove mock functionality
  const mockCategories = [
    { id: "1", name: "Groceries", icon: "Shopping", totalSpent: 450.00 },
    { id: "2", name: "Dining Out", icon: "Food", totalSpent: 320.50 },
    { id: "3", name: "Transport", icon: "Transport", totalSpent: 280.00 },
    { id: "4", name: "Utilities", icon: "Utilities", totalSpent: 180.00 },
    { id: "5", name: "Entertainment", icon: "Entertainment", totalSpent: 120.00 },
    { id: "6", name: "Healthcare", icon: "Health", totalSpent: 95.00 },
  ];

  return (
    <div className="w-full max-w-4xl">
      <CategoryManagement
        categories={mockCategories}
        onAdd={(name, icon) => console.log("Add:", name, icon)}
        onEdit={(id, name, icon) => console.log("Edit:", id, name, icon)}
        onDelete={(id) => console.log("Delete:", id)}
      />
    </div>
  );
}
