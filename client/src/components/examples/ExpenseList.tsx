import { ExpenseList } from "../ExpenseList";

export default function ExpenseListExample() {
  // todo: remove mock functionality
  const mockExpenses = [
    { id: "1", amount: 45.99, description: "Weekly groceries", category: "groceries", merchant: "Whole Foods", date: new Date(), hasReceipt: true },
    { id: "2", amount: 12.50, description: "Lunch", category: "food", merchant: "Chipotle", date: new Date(Date.now() - 86400000) },
    { id: "3", amount: 35.00, description: "Gas", category: "transport", merchant: "Shell", date: new Date(Date.now() - 172800000), hasReceipt: true },
    { id: "4", amount: 150.00, description: "Electric bill", category: "utilities", merchant: "PG&E", date: new Date(Date.now() - 259200000) },
    { id: "5", amount: 25.00, description: "Movie night", category: "entertainment", merchant: "AMC Theaters", date: new Date(Date.now() - 345600000) },
  ];

  return (
    <div className="w-full max-w-4xl">
      <ExpenseList
        expenses={mockExpenses}
        onEdit={(e) => console.log("Edit:", e)}
        onDelete={(id) => console.log("Delete:", id)}
      />
    </div>
  );
}
