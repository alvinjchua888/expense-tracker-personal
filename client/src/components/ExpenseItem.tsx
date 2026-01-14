import { MoreVertical, Pencil, Trash2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { CategoryBadge } from "./CategoryBadge";
import { format } from "date-fns";
import { CURRENCY_SYMBOLS, type Currency } from "@shared/schema";

export interface Expense {
  id: string;
  amount: number;
  currency: Currency;
  description: string;
  category: string;
  merchant: string;
  date: Date;
  hasReceipt?: boolean;
}

interface ExpenseItemProps {
  expense: Expense;
  onEdit?: (expense: Expense) => void;
  onDelete?: (id: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

export function ExpenseItem({ expense, onEdit, onDelete, selectable, selected, onSelect }: ExpenseItemProps) {
  return (
    <div
      className="flex items-center justify-between gap-4 p-4 hover-elevate rounded-md"
      data-testid={`expense-item-${expense.id}`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {selectable && (
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelect?.(expense.id, !!checked)}
            data-testid={`checkbox-expense-${expense.id}`}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium truncate">{expense.merchant}</p>
            {expense.hasReceipt && (
              <Receipt className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {expense.description}
          </p>
        </div>
        <CategoryBadge category={expense.category} size="sm" />
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-semibold tabular-nums">
            {CURRENCY_SYMBOLS[expense.currency]}{expense.amount.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(expense.date, "MMM d, yyyy")}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid={`button-expense-menu-${expense.id}`}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onEdit?.(expense)}
              data-testid={`button-edit-expense-${expense.id}`}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete?.(expense.id)}
              className="text-destructive"
              data-testid={`button-delete-expense-${expense.id}`}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
