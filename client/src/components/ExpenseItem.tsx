import { useState } from "react";
import { MoreVertical, Pencil, Trash2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CategoryBadge } from "./CategoryBadge";
import { format } from "date-fns";
import { useCurrency } from "@/hooks/useCurrency";
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
}

export function ExpenseItem({ expense, onEdit, onDelete }: ExpenseItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { formatAmount, displayCurrency } = useCurrency();
  const originalSymbol = CURRENCY_SYMBOLS[expense.currency];
  const showOriginal = expense.currency !== displayCurrency;

  return (
    <>
      <div
        className="flex items-center justify-between gap-4 p-4 hover-elevate rounded-md"
        data-testid={`expense-item-${expense.id}`}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
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
              {formatAmount(expense.amount, expense.currency)}
            </p>
            {showOriginal && (
              <p className="text-xs text-muted-foreground tabular-nums">
                {originalSymbol}{expense.amount.toFixed(2)} {expense.currency}
              </p>
            )}
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
                onClick={() => setShowDeleteConfirm(true)}
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

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the expense from "{expense.merchant}" for {formatAmount(expense.amount, expense.currency)}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onDelete?.(expense.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
