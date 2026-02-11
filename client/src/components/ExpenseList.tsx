import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExpenseItem, type Expense } from "./ExpenseItem";
import { defaultCategories } from "./CategoryBadge";

interface ExpenseListProps {
  expenses: Expense[];
  onEdit?: (expense: Expense) => void;
  onDelete?: (id: string) => void;
}

export function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredExpenses = expenses.filter((expense) => {
    return categoryFilter === "all" ||
      expense.category.toLowerCase() === categoryFilter.toLowerCase();
  });

  return (
    <Card data-testid="expense-list-card">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <CardTitle className="text-lg font-semibold">Recent Expenses</CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36" data-testid="select-category-filter">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {defaultCategories.map((cat) => (
                <SelectItem key={cat} value={cat} className="capitalize">
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {filteredExpenses.length > 0 ? (
            filteredExpenses.map((expense) => (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p>No expenses found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
