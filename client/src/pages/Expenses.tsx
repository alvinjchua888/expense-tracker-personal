import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ReceiptUpload } from "@/components/ReceiptUpload";
import { DateRangePicker } from "@/components/DateRangePicker";
import { ExportData } from "@/components/ExportData";
import { Pagination } from "@/components/Pagination";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import type { Expense as DbExpense, Category, Currency } from "@shared/schema";
import type { DateRange } from "react-day-picker";

interface Expense {
  id: string;
  amount: number;
  currency: Currency;
  description: string;
  category: string;
  merchant: string;
  date: Date;
  hasReceipt?: boolean;
}

interface PaginatedResponse {
  expenses: DbExpense[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function Expenses() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const queryKey = [
    "/api/expenses",
    dateRange?.from?.toISOString(),
    dateRange?.to?.toISOString(),
    currentPage,
    pageSize,
  ].filter(Boolean);

  const { data: paginatedData, isLoading: expensesLoading } = useQuery<PaginatedResponse>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange?.from) params.append("startDate", dateRange.from.toISOString());
      if (dateRange?.to) params.append("endDate", dateRange.to.toISOString());
      params.append("page", currentPage.toString());
      params.append("limit", pageSize.toString());
      const url = `/api/expenses?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch expenses");
      return response.json();
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: { amount: number; currency: string; merchant: string; description?: string; categoryId?: number; date: Date }) => {
      return apiRequest("POST", "/api/expenses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { amount: number; currency: string; merchant: string; description?: string; categoryId?: number; date: Date } }) => {
      return apiRequest("PUT", `/api/expenses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return apiRequest("POST", "/api/expenses/bulk-delete", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
    },
  });

  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  const categoryIdMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));

  const dbExpenses = paginatedData?.expenses || [];
  const totalItems = paginatedData?.total || 0;
  const totalPages = paginatedData?.totalPages || 1;

  const expenses: Expense[] = dbExpenses.map(e => ({
    id: e.id.toString(),
    amount: e.amount,
    currency: (e.currency || "USD") as Currency,
    description: e.description || "",
    category: categoryMap.get(e.categoryId || 0) || "Other",
    merchant: e.merchant,
    date: new Date(e.date),
    hasReceipt: e.hasReceipt || false,
  }));

  const handleAddExpense = (data: { amount: string; currency: string; merchant: string; description?: string; category: string; date: Date }) => {
    const categoryId = categoryIdMap.get(data.category.toLowerCase());
    createExpenseMutation.mutate({
      amount: parseFloat(data.amount),
      currency: data.currency,
      merchant: data.merchant,
      description: data.description,
      categoryId,
      date: data.date,
    });
  };

  const handleUpdateExpense = (id: string, data: { amount: string; currency: string; merchant: string; description?: string; category: string; date: Date }) => {
    const categoryId = categoryIdMap.get(data.category.toLowerCase());
    updateExpenseMutation.mutate({
      id,
      data: {
        amount: parseFloat(data.amount),
        currency: data.currency,
        merchant: data.merchant,
        description: data.description,
        categoryId,
        date: data.date,
      },
    });
    setEditingExpense(null);
    setIsEditDialogOpen(false);
  };

  const handleReceiptData = (data: { merchant?: string; amount?: string; date?: string; suggestedCategory?: string }) => {
    const categoryId = categoryIdMap.get((data.suggestedCategory || "").toLowerCase());
    createExpenseMutation.mutate({
      amount: parseFloat(data.amount || "0"),
      currency: "USD",
      merchant: data.merchant || "Unknown",
      description: "Scanned from receipt",
      categoryId,
      date: data.date ? new Date(data.date) : new Date(),
    });
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditDialogOpen(true);
  };

  const handleDeleteExpense = (id: string) => {
    deleteExpenseMutation.mutate(id);
  };

  const handleBulkDelete = (ids: string[]) => {
    bulkDeleteMutation.mutate(ids);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setCurrentPage(1);
  };

  const handleEditDialogChange = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setEditingExpense(null);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
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
          <ExportData expenses={expenses} />
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
        <>
          <ExpenseList
            expenses={expenses}
            onDelete={handleDeleteExpense}
            onEdit={handleEditExpense}
            onBulkDelete={handleBulkDelete}
          />
          {totalItems > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </>
      )}

      <ExpenseForm
        expense={editingExpense}
        open={isEditDialogOpen}
        onOpenChange={handleEditDialogChange}
        onUpdate={handleUpdateExpense}
      />
    </div>
  );
}
