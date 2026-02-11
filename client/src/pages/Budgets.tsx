import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCurrency } from "@/hooks/useCurrency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Pencil, Target, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Category, Budget } from "@shared/schema";

interface BudgetProgress {
  budgetId: number;
  categoryId: number;
  categoryName: string;
  monthlyLimit: number;
  spent: number;
}

export default function Budgets() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetProgress | null>(null);
  const [deletingBudgetId, setDeletingBudgetId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [monthlyLimit, setMonthlyLimit] = useState<string>("");
  const { toast } = useToast();
  const { formatAmount, symbol } = useCurrency();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: budgetProgress = [], isLoading } = useQuery<BudgetProgress[]>({
    queryKey: ["/api/budgets/progress"],
  });

  const { data: budgets = [] } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
  });

  const createBudgetMutation = useMutation({
    mutationFn: async (data: { categoryId: number; monthlyLimit: number }) => {
      return apiRequest("POST", "/api/budgets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets/progress"] });
      toast({ title: "Budget created successfully" });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Failed to create budget", description: error.message, variant: "destructive" });
    },
  });

  const updateBudgetMutation = useMutation({
    mutationFn: async ({ id, monthlyLimit }: { id: number; monthlyLimit: number }) => {
      return apiRequest("PUT", `/api/budgets/${id}`, { monthlyLimit });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets/progress"] });
      toast({ title: "Budget updated successfully" });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Failed to update budget", description: error.message, variant: "destructive" });
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/budgets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets/progress"] });
      toast({ title: "Budget deleted" });
      setDeletingBudgetId(null);
    },
  });

  const resetForm = () => {
    setDialogOpen(false);
    setEditingBudget(null);
    setSelectedCategoryId("");
    setMonthlyLimit("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(monthlyLimit);
    if (isNaN(limit) || limit <= 0) {
      toast({ title: "Please enter a valid budget amount", variant: "destructive" });
      return;
    }

    if (editingBudget) {
      updateBudgetMutation.mutate({ id: editingBudget.budgetId, monthlyLimit: limit });
    } else {
      const catId = parseInt(selectedCategoryId);
      if (isNaN(catId)) {
        toast({ title: "Please select a category", variant: "destructive" });
        return;
      }
      createBudgetMutation.mutate({ categoryId: catId, monthlyLimit: limit });
    }
  };

  const handleEdit = (bp: BudgetProgress) => {
    setEditingBudget(bp);
    setMonthlyLimit(bp.monthlyLimit.toString());
    setSelectedCategoryId(bp.categoryId.toString());
    setDialogOpen(true);
  };

  // Categories that don't already have a budget
  const budgetedCategoryIds = new Set(budgets.map(b => b.categoryId));
  const availableCategories = categories.filter(c => !budgetedCategoryIds.has(c.id));

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 100) return <AlertTriangle className="h-5 w-5 text-red-500" />;
    if (percentage >= 80) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  };

  const now = new Date();
  const monthName = now.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6" data-testid="budgets-page">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Budget Goals</h1>
          <p className="text-muted-foreground">
            Set monthly spending limits per category - {monthName}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Set Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBudget ? "Edit Budget" : "Set Category Budget"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                {editingBudget ? (
                  <Input value={editingBudget.categoryName} disabled />
                ) : (
                  <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.length === 0 ? (
                        <SelectItem value="none" disabled>All categories have budgets</SelectItem>
                      ) : (
                        availableCategories.map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label>Monthly Limit ({symbol})</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 5000"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={createBudgetMutation.isPending || updateBudgetMutation.isPending}>
                {editingBudget ? "Update Budget" : "Create Budget"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : budgetProgress.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No budgets set</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Set monthly spending limits for your categories to track your spending against your goals.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetProgress.map((bp) => {
            const percentage = bp.monthlyLimit > 0 ? Math.round((bp.spent / bp.monthlyLimit) * 100) : 0;
            const remaining = bp.monthlyLimit - bp.spent;
            const progressColor = getProgressColor(percentage);

            return (
              <Card key={bp.budgetId}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      {getStatusIcon(percentage)}
                      {bp.categoryName}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(bp)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingBudgetId(bp.budgetId)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Spent</span>
                    <span className="font-medium">
                      {formatAmount(bp.spent)} / {formatAmount(bp.monthlyLimit)}
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={Math.min(percentage, 100)} className="h-3" />
                    <div
                      className={`absolute top-0 left-0 h-full rounded-full transition-all ${progressColor}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={percentage >= 100 ? "text-red-500 font-medium" : "text-muted-foreground"}>
                      {percentage}% used
                    </span>
                    <span className={remaining < 0 ? "text-red-500 font-medium" : "text-green-600 font-medium"}>
                      {remaining >= 0 ? `${formatAmount(remaining)} left` : `${formatAmount(Math.abs(remaining))} over`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={deletingBudgetId !== null} onOpenChange={(open) => { if (!open) setDeletingBudgetId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this budget? This won't affect your existing expenses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingBudgetId && deleteBudgetMutation.mutate(deletingBudgetId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
