import { DollarSign, Calendar, Wallet, TrendingUp } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { StatCard } from "@/components/StatCard";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ReceiptUpload } from "@/components/ReceiptUpload";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/hooks/useCurrency";
import { CURRENCY_SYMBOLS, type Currency, type Expense as DbExpense, type Category } from "@shared/schema";

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

export default function Dashboard() {
  const { data: dbExpenses = [], isLoading: expensesLoading } = useQuery<DbExpense[]>({
    queryKey: ["/api/expenses"],
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
    currency: (e.currency || "USD") as Currency,
    description: e.description || "",
    category: categoryMap.get(e.categoryId || 0) || "Other",
    merchant: e.merchant,
    date: new Date(e.date),
    hasReceipt: e.hasReceipt || false,
  }));

  const { convert, formatAmount, symbol: currencySymbol } = useCurrency();
  
  const totalExpenses = expenses.reduce((sum, e) => sum + convert(e.amount, e.currency), 0);
  const thisMonth = expenses
    .filter((e) => {
      const now = new Date();
      return e.date.getMonth() === now.getMonth() && e.date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + convert(e.amount, e.currency), 0);
  const thisWeek = expenses
    .filter((e) => {
      const weekAgo = new Date(Date.now() - 7 * 86400000);
      return e.date >= weekAgo;
    })
    .reduce((sum, e) => sum + convert(e.amount, e.currency), 0);

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

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Track and manage your daily expenses</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ReceiptUpload onExtracted={handleReceiptData} />
          <ExpenseForm onSubmit={handleAddExpense} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {expensesLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <StatCard
              title="Total Expenses"
              value={`${currencySymbol}${totalExpenses.toFixed(2)}`}
              icon={<DollarSign className="h-6 w-6" />}
            />
            <StatCard
              title="This Month"
              value={`${currencySymbol}${thisMonth.toFixed(2)}`}
              icon={<Calendar className="h-6 w-6" />}
            />
            <StatCard
              title="This Week"
              value={`${currencySymbol}${thisWeek.toFixed(2)}`}
              icon={<Wallet className="h-6 w-6" />}
            />
            <StatCard
              title="Avg. Daily"
              value={`${currencySymbol}${(thisMonth / 30).toFixed(2)}`}
              icon={<TrendingUp className="h-6 w-6" />}
            />
          </>
        )}
      </div>

      {expensesLoading ? (
        <div className="space-y-2">
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
