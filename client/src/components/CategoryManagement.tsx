import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Pencil,
  Trash2,
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

const iconOptions = [
  { name: "Shopping", icon: ShoppingCart },
  { name: "Food", icon: Utensils },
  { name: "Transport", icon: Car },
  { name: "Home", icon: Home },
  { name: "Utilities", icon: Zap },
  { name: "Entertainment", icon: Film },
  { name: "Health", icon: Heart },
  { name: "Education", icon: GraduationCap },
  { name: "Travel", icon: Plane },
  { name: "Other", icon: MoreHorizontal },
];

interface Category {
  id: string;
  name: string;
  icon: string;
  totalSpent: number;
}

interface CategoryManagementProps {
  categories: Category[];
  onAdd?: (name: string, icon: string) => void;
  onEdit?: (id: string, name: string, icon: string) => void;
  onDelete?: (id: string) => void;
}

export function CategoryManagement({
  categories,
  onAdd,
  onEdit,
  onDelete,
}: CategoryManagementProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newName, setNewName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Shopping");

  const handleAdd = () => {
    if (newName.trim()) {
      onAdd?.(newName.trim(), selectedIcon);
      console.log("Add category:", newName, selectedIcon);
      setNewName("");
      setSelectedIcon("Shopping");
      setIsAddOpen(false);
    }
  };

  const handleEdit = () => {
    if (editingCategory && newName.trim()) {
      onEdit?.(editingCategory.id, newName.trim(), selectedIcon);
      console.log("Edit category:", editingCategory.id, newName, selectedIcon);
      setEditingCategory(null);
      setNewName("");
    }
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = iconOptions.find((i) => i.name === iconName)?.icon || MoreHorizontal;
    return <IconComponent className="h-6 w-6" />;
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setNewName(category.name);
    setSelectedIcon(category.icon);
  };

  return (
    <Card data-testid="category-management-card">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-lg">Categories</CardTitle>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-category">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-add-category">
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="category-name">Name</Label>
                <Input
                  id="category-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Category name"
                  data-testid="input-category-name"
                />
              </div>
              <div>
                <Label>Icon</Label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {iconOptions.map((option) => (
                    <Button
                      key={option.name}
                      variant={selectedIcon === option.name ? "default" : "outline"}
                      size="icon"
                      onClick={() => setSelectedIcon(option.name)}
                      data-testid={`button-icon-${option.name.toLowerCase()}`}
                    >
                      <option.icon className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} data-testid="button-save-category">
                  Add Category
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="group relative p-4 rounded-lg bg-muted/50 hover-elevate text-center"
              data-testid={`category-item-${category.id}`}
            >
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => openEditDialog(category)}
                  data-testid={`button-edit-category-${category.id}`}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => {
                    onDelete?.(category.id);
                    console.log("Delete category:", category.id);
                  }}
                  data-testid={`button-delete-category-${category.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex justify-center mb-2 text-primary">
                {getIconComponent(category.icon)}
              </div>
              <p className="font-medium text-sm capitalize">{category.name}</p>
              <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                ${category.totalSpent.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>

      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent data-testid="dialog-edit-category">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-category-name">Name</Label>
              <Input
                id="edit-category-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Category name"
                data-testid="input-edit-category-name"
              />
            </div>
            <div>
              <Label>Icon</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {iconOptions.map((option) => (
                  <Button
                    key={option.name}
                    variant={selectedIcon === option.name ? "default" : "outline"}
                    size="icon"
                    onClick={() => setSelectedIcon(option.name)}
                  >
                    <option.icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingCategory(null)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} data-testid="button-update-category">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
