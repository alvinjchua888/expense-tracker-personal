import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ReceiptUpload } from "@/components/ReceiptUpload";
import { DateRangePicker } from "@/components/DateRangePicker";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import type { Expense as DbExpense, Category } from "@shared/schema";
import type { DateRange } from "react-day-picker";

interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  merchant: string;
  date: Date;
  hasReceipt?: boolean;
}

export default function Expenses() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const queryKey = ["/api/expenses", dateRange?.from?.toISOString(), dateRange?.to?.toISOString()].filter(Boolean);
  
  const { data: dbExpenses = [], isLoading: expensesLoading } = useQuery<DbExpense[]>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange?.from) params.append("startDate", dateRange.from.toISOString());
      if (dateRange?.to) params.append("endDate", dateRange.to.toISOString());
      const url = `/api/expenses${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch expenses");
      return response.json();
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: { amount: number; merchant: string; description?: string; categoryId?: number; date: Date }) => {
      return apiRequest("POST", "/api/expenses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
    },
  });

  const categoryMap = new Map(categories.map(c => [c.id, c.name]));

  const expenses: Expense[] = dbExpenses.map(e => ({
    id: e.id.toString(),
    amount: e.amount,
    description: e.description || "",
    category: categoryMap.get(e.categoryId || 0) || "Other",
    merchant: e.merchant,
    date: new Date(e.date),
    hasReceipt: e.hasReceipt || false,
  }));

  const handleAddExpense = (data: { amount: string; merchant: string; description?: string; category: string; date: Date }) => {
    const categoryId = categories.find(c => c.name.toLowerCase() === data.category.toLowerCase())?.id;
    createExpenseMutation.mutate({
      amount: parseFloat(data.amount),
      merchant: data.merchant,
      description: data.description,
      categoryId,
      date: data.date,
    });
  };

  const handleReceiptData = (data: { merchant?: string; amount?: string; date?: string; suggestedCategory?: string }) => {
    const categoryId = categories.find(c => 
      c.name.toLowerCase() === (data.suggestedCategory || "").toLowerCase()
    )?.id;
    createExpenseMutation.mutate({
      amount: parseFloat(data.amount || "0"),
      merchant: data.merchant || "Unknown",
      description: "Scanned from receipt",
      categoryId,
      date: data.date ? new Date(data.date) : new Date(),
    });
  };

  const handleDeleteExpense = (id: string) => {
    deleteExpenseMutation.mutate(id);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  return (
    <div className="space-y-6" data-testid="expenses-page">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">
            View and manage all your expenses
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangePicker onRangeChange={handleDateRangeChange} />
          <ReceiptUpload onExtracted={handleReceiptData} />
          <ExpenseForm onSubmit={handleAddExpense} />
        </div>
      </div>

      {expensesLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : (
        <ExpenseList
          expenses={expenses}
          onDelete={handleDeleteExpense}
          onEdit={(e) => console.log("Edit expense:", e)}
        />
      )}
    </div>
  );
}
