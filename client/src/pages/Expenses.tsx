import { useState } from "react";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ReceiptUpload } from "@/components/ReceiptUpload";
import { DateRangePicker } from "@/components/DateRangePicker";
import type { Expense } from "@/components/ExpenseItem";

// todo: remove mock functionality
const initialExpenses: Expense[] = [
  { id: "1", amount: 45.99, description: "Weekly groceries", category: "groceries", merchant: "Whole Foods", date: new Date(), hasReceipt: true },
  { id: "2", amount: 12.50, description: "Lunch with team", category: "food", merchant: "Chipotle", date: new Date(Date.now() - 86400000) },
  { id: "3", amount: 35.00, description: "Gas refill", category: "transport", merchant: "Shell", date: new Date(Date.now() - 172800000), hasReceipt: true },
  { id: "4", amount: 150.00, description: "Monthly electric bill", category: "utilities", merchant: "PG&E", date: new Date(Date.now() - 259200000) },
  { id: "5", amount: 25.00, description: "Movie night", category: "entertainment", merchant: "AMC Theaters", date: new Date(Date.now() - 345600000) },
  { id: "6", amount: 89.99, description: "Prescription medication", category: "health", merchant: "CVS Pharmacy", date: new Date(Date.now() - 432000000), hasReceipt: true },
  { id: "7", amount: 200.00, description: "Monthly gym membership", category: "health", merchant: "Planet Fitness", date: new Date(Date.now() - 518400000) },
  { id: "8", amount: 65.00, description: "Weekly fuel", category: "transport", merchant: "Chevron", date: new Date(Date.now() - 604800000), hasReceipt: true },
  { id: "9", amount: 120.00, description: "Internet bill", category: "utilities", merchant: "Comcast", date: new Date(Date.now() - 691200000) },
  { id: "10", amount: 55.00, description: "Dinner date", category: "food", merchant: "Olive Garden", date: new Date(Date.now() - 777600000) },
];

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);

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
    <div className="space-y-6" data-testid="expenses-page">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">
            View and manage all your expenses
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangePicker onRangeChange={(range) => console.log("Range:", range)} />
          <ReceiptUpload onExtracted={handleReceiptData} />
          <ExpenseForm onSubmit={handleAddExpense} />
        </div>
      </div>

      <ExpenseList
        expenses={expenses}
        onDelete={handleDeleteExpense}
        onEdit={(e) => console.log("Edit expense:", e)}
      />
    </div>
  );
}
