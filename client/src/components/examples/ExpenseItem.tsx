import { ExpenseItem } from "../ExpenseItem";

export default function ExpenseItemExample() {
  // todo: remove mock functionality
  const mockExpense = {
    id: "1",
    amount: 45.99,
    description: "Weekly groceries",
    category: "groceries",
    merchant: "Whole Foods",
    date: new Date(),
    hasReceipt: true,
  };

  return (
    <div className="w-full max-w-2xl bg-card rounded-lg border border-card-border">
      <ExpenseItem
        expense={mockExpense}
        onEdit={(e) => console.log("Edit expense:", e)}
        onDelete={(id) => console.log("Delete expense:", id)}
      />
    </div>
  );
}
