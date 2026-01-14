import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Currency } from "@shared/schema";

interface Expense {
  id: string;
  amount: number;
  currency: Currency;
  description: string;
  category: string;
  merchant: string;
  date: Date;
}

interface ExportDataProps {
  expenses: Expense[];
  filename?: string;
}

export function ExportData({ expenses, filename = "expenses" }: ExportDataProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toISOString().split("T")[0];
  };

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const headers = ["Date", "Merchant", "Category", "Amount", "Currency", "Description"];
      const rows = expenses.map((expense) => [
        formatDate(expense.date),
        `"${expense.merchant.replace(/"/g, '""')}"`,
        expense.category,
        expense.amount.toFixed(2),
        expense.currency,
        `"${(expense.description || "").replace(/"/g, '""')}"`,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}-${formatDate(new Date())}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `Exported ${expenses.length} expenses to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export expenses",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = () => {
    setIsExporting(true);
    try {
      const exportData = expenses.map((expense) => ({
        date: formatDate(expense.date),
        merchant: expense.merchant,
        category: expense.category,
        amount: expense.amount,
        currency: expense.currency,
        description: expense.description || "",
      }));

      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}-${formatDate(new Date())}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `Exported ${expenses.length} expenses to JSON`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export expenses",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (expenses.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting} data-testid="button-export">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV} data-testid="export-csv">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON} data-testid="export-json">
          <FileText className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
