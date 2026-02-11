import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ReceiptUpload } from "@/components/ReceiptUpload";
import { DateRangePicker } from "@/components/DateRangePicker";
import { apiRequest, queryClient, invalidateExpenseRelatedQueries } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, ChevronLeft, ChevronRight, Search } from "lucide-react";
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

interface EditingExpense {
  id: string;
  amount: string;
  currency: string;
  merchant: string;
  description: string;
  category: string;
  date: Date;
}

interface PaginatedResponse {
  data: DbExpense[];
  total: number;
  limit: number;
  offset: number;
}

const PAGE_SIZE = 20;

export default function Expenses() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [editingExpense, setEditingExpense] = useState<EditingExpense | null>(null);
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [dateRange]);

  const queryKey = ["/api/expenses", dateRange?.from?.toISOString(), dateRange?.to?.toISOString(), String(page), search].filter(Boolean);

  const { data: paginatedData, isLoading: expensesLoading } = useQuery<PaginatedResponse>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange?.from) params.append("startDate", dateRange.from.toISOString());
      if (dateRange?.to) params.append("endDate", dateRange.to.toISOString());
      params.append("limit", String(PAGE_SIZE));
      params.append("offset", String(page * PAGE_SIZE));
      if (search) params.append("search", search);
      const url = `/api/expenses?${params.toString()}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch expenses");
      return response.json();
    },
  });

  const dbExpenses = paginatedData?.data ?? [];
  const totalExpenses = paginatedData?.total ?? 0;
  const totalPages = Math.ceil(totalExpenses / PAGE_SIZE);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: { amount: number; currency: string; merchant: string; description?: string; categoryId?: number; date: Date }) => {
      return apiRequest("POST", "/api/expenses", data);
    },
    onSuccess: () => {
      invalidateExpenseRelatedQueries();
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      invalidateExpenseRelatedQueries();
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; amount: number; currency: string; merchant: string; description?: string; categoryId?: number; date: Date }) => {
      return apiRequest("PUT", `/api/expenses/${id}`, data);
    },
    onSuccess: () => {
      invalidateExpenseRelatedQueries();
    },
  });

  const categoryMap = new Map(categories.map(c => [c.id, c.name]));

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
    const categoryId = categories.find(c => c.name.toLowerCase() === data.category.toLowerCase())?.id;
    createExpenseMutation.mutate({
      amount: parseFloat(data.amount),
      currency: data.currency,
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
      currency: "USD",
      merchant: data.merchant || "Unknown",
      description: "Scanned from receipt",
      categoryId,
      date: data.date ? new Date(data.date) : new Date(),
    });
  };

  const handleDeleteExpense = (id: string) => {
    deleteExpenseMutation.mutate(id);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense({
      id: expense.id,
      amount: expense.amount.toString(),
      currency: expense.currency,
      merchant: expense.merchant,
      description: expense.description,
      category: expense.category,
      date: expense.date,
    });
  };

  const handleUpdateExpense = (data: { amount: string; currency: string; merchant: string; description?: string; category: string; date: Date }) => {
    if (!editingExpense) return;
    const categoryId = categories.find(c => c.name.toLowerCase() === data.category.toLowerCase())?.id;
    updateExpenseMutation.mutate({
      id: editingExpense.id,
      amount: parseFloat(data.amount),
      currency: data.currency,
      merchant: data.merchant,
      description: data.description,
      categoryId,
      date: data.date,
    });
    setEditingExpense(null);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (dateRange?.from) params.append("startDate", dateRange.from.toISOString());
    if (dateRange?.to) params.append("endDate", dateRange.to.toISOString());
    const url = `/api/expenses/export/csv${params.toString() ? `?${params.toString()}` : ""}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
          <Button variant="outline" onClick={handleExportCsv} disabled={totalExpenses === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <ReceiptUpload onExtracted={handleReceiptData} />
          <ExpenseForm onSubmit={handleAddExpense} />
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by merchant or description..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-10"
        />
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
          onEdit={handleEditExpense}
        />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, totalExpenses)} of {totalExpenses} expenses
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <ExpenseForm
        isEditing
        open={!!editingExpense}
        onOpenChange={(open) => { if (!open) setEditingExpense(null); }}
        defaultValues={editingExpense ? {
          amount: editingExpense.amount,
          currency: editingExpense.currency,
          merchant: editingExpense.merchant,
          description: editingExpense.description,
          category: editingExpense.category,
          date: editingExpense.date,
        } : undefined}
        onSubmit={handleUpdateExpense}
      />
    </div>
  );
}
