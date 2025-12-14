import { useState } from "react";
import { DollarSign, Calendar, Wallet, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ReceiptUpload } from "@/components/ReceiptUpload";
import type { Expense } from "@/components/ExpenseItem";

// todo: remove mock functionality
const initialExpenses: Expense[] = [
  { id: "1", amount: 45.99, description: "Weekly groceries", category: "groceries", merchant: "Whole Foods", date: new Date(), hasReceipt: true },
  { id: "2", amount: 12.50, description: "Lunch with team", category: "food", merchant: "Chipotle", date: new Date(Date.now() - 86400000) },
  { id: "3", amount: 35.00, description: "Gas refill", category: "transport", merchant: "Shell", date: new Date(Date.now() - 172800000), hasReceipt: true },
  { id: "4", amount: 150.00, description: "Monthly electric bill", category: "utilities", merchant: "PG&E", date: new Date(Date.now() - 259200000) },
  { id: "5", amount: 25.00, description: "Movie night", category: "entertainment", merchant: "AMC Theaters", date: new Date(Date.now() - 345600000) },
  { id: "6", amount: 89.99, description: "Prescription medication", category: "health", merchant: "CVS Pharmacy", date: new Date(Date.now() - 432000000), hasReceipt: true },
];

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const thisMonth = expenses
    .filter((e) => {
      const now = new Date();
      return e.date.getMonth() === now.getMonth() && e.date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + e.amount, 0);
  const thisWeek = expenses
    .filter((e) => {
      const weekAgo = new Date(Date.now() - 7 * 86400000);
      return e.date >= weekAgo;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const handleAddExpense = (data: { amount: string; merchant: string; description?: string; category: string; date: Date }) => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      amount: parseFloat(data.amount),
      merchant: data.merchant,
      description: data.description || "",
      category: data.category,
      date: data.date,
    };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const handleReceiptData = (data: { merchant?: string; amount?: string; date?: string }) => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      amount: parseFloat(data.amount || "0"),
      merchant: data.merchant || "Unknown",
      description: "Scanned from receipt",
      category: "groceries",
      date: data.date ? new Date(data.date) : new Date(),
      hasReceipt: true,
    };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
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
        <StatCard
          title="Total Expenses"
          value={`$${totalExpenses.toFixed(2)}`}
          trend={{ value: 12.5, isPositive: false }}
          icon={<DollarSign className="h-6 w-6" />}
        />
        <StatCard
          title="This Month"
          value={`$${thisMonth.toFixed(2)}`}
          trend={{ value: 8.2, isPositive: true }}
          icon={<Calendar className="h-6 w-6" />}
        />
        <StatCard
          title="This Week"
          value={`$${thisWeek.toFixed(2)}`}
          icon={<Wallet className="h-6 w-6" />}
        />
        <StatCard
          title="Avg. Daily"
          value={`$${(thisMonth / 30).toFixed(2)}`}
          trend={{ value: 3.1, isPositive: false }}
          icon={<TrendingUp className="h-6 w-6" />}
        />
      </div>

      <ExpenseList
        expenses={expenses}
        onDelete={handleDeleteExpense}
        onEdit={(e) => console.log("Edit expense:", e)}
      />
    </div>
  );
}
