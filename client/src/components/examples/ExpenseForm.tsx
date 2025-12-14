import { ExpenseForm } from "../ExpenseForm";

export default function ExpenseFormExample() {
  return (
    <ExpenseForm
      onSubmit={(data) => console.log("Expense submitted:", data)}
    />
  );
}
