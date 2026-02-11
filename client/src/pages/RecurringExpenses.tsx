import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, invalidateExpenseRelatedQueries } from "@/lib/queryClient";
import { useCurrency } from "@/hooks/useCurrency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Trash2, Pencil, Repeat, Play, Pause } from "lucide-react";
import { CURRENCIES, type Category, type RecurringExpense } from "@shared/schema";

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

interface FormData {
  amount: string;
  currency: string;
  merchant: string;
  description: string;
  categoryId: string;
  frequency: string;
  startDate: string;
  endDate: string;
}

const emptyForm: FormData = {
  amount: "",
  currency: "PHP",
  merchant: "",
  description: "",
  categoryId: "",
  frequency: "monthly",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
};

export default function RecurringExpenses() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const { toast } = useToast();
  const { formatAmount } = useCurrency();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: recurringExpenses = [], isLoading } = useQuery<RecurringExpense[]>({
    queryKey: ["/api/recurring-expenses"],
  });

  const categoryMap = new Map(categories.map(c => [c.id, c.name]));

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/recurring-expenses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-expenses"] });
      toast({ title: "Recurring expense created" });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Failed to create", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; [key: string]: any }) => apiRequest("PUT", `/api/recurring-expenses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-expenses"] });
      toast({ title: "Recurring expense updated" });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/recurring-expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-expenses"] });
      toast({ title: "Recurring expense deleted" });
      setDeletingId(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest("PUT", `/api/recurring-expenses/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-expenses"] });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/recurring-expenses/generate"),
    onSuccess: async (response) => {
      const data = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-expenses"] });
      invalidateExpenseRelatedQueries();
      toast({ title: `Generated ${data.generated} expense(s)` });
    },
    onError: () => {
      toast({ title: "Failed to generate expenses", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleEdit = (re: RecurringExpense) => {
    setEditingId(re.id);
    setForm({
      amount: re.amount.toString(),
      currency: re.currency || "PHP",
      merchant: re.merchant,
      description: re.description || "",
      categoryId: re.categoryId?.toString() || "",
      frequency: re.frequency,
      startDate: new Date(re.startDate).toISOString().split("T")[0],
      endDate: re.endDate ? new Date(re.endDate).toISOString().split("T")[0] : "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }
    if (!form.merchant.trim()) {
      toast({ title: "Please enter a merchant name", variant: "destructive" });
      return;
    }

    const payload = {
      amount,
      currency: form.currency,
      merchant: form.merchant.trim(),
      description: form.description.trim() || null,
      categoryId: form.categoryId ? parseInt(form.categoryId) : null,
      frequency: form.frequency,
      startDate: form.startDate,
      endDate: form.endDate || null,
      isActive: true,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const updateField = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6" data-testid="recurring-expenses-page">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Recurring Expenses</h1>
          <p className="text-muted-foreground">
            Manage subscriptions and regular payments
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            <Play className="h-4 w-4 mr-2" />
            Generate Due
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Recurring
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Recurring Expense" : "Add Recurring Expense"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={(e) => updateField("amount", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={form.currency} onValueChange={(v) => updateField("currency", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Merchant</Label>
                  <Input
                    placeholder="e.g. Netflix, Spotify"
                    value={form.merchant}
                    onChange={(e) => updateField("merchant", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Input
                    placeholder="Monthly subscription"
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.categoryId} onValueChange={(v) => updateField("categoryId", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={form.frequency} onValueChange={(v) => updateField("frequency", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map(f => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => updateField("startDate", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date (optional)</Label>
                    <Input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => updateField("endDate", e.target.value)}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? "Update" : "Create"} Recurring Expense
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : recurringExpenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Repeat className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No recurring expenses</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Add subscriptions and regular payments to automatically track recurring costs.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recurringExpenses.map((re) => (
            <Card key={re.id} className={!re.isActive ? "opacity-60" : ""}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{re.merchant}</span>
                      <Badge variant="secondary" className="capitalize text-xs">{re.frequency}</Badge>
                      {re.categoryId && (
                        <Badge variant="outline" className="text-xs">
                          {categoryMap.get(re.categoryId) || "Unknown"}
                        </Badge>
                      )}
                      {!re.isActive && <Badge variant="destructive" className="text-xs">Paused</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {re.description && <span>{re.description} · </span>}
                      Started {new Date(re.startDate).toLocaleDateString()}
                      {re.endDate && ` · Ends ${new Date(re.endDate).toLocaleDateString()}`}
                      {re.lastGeneratedDate && (
                        <span> · Last generated {new Date(re.lastGeneratedDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold">
                      {formatAmount(re.amount, (re.currency || "PHP") as any)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      per {re.frequency === "daily" ? "day" : re.frequency === "weekly" ? "week" : re.frequency === "monthly" ? "month" : "year"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title={re.isActive ? "Pause" : "Resume"}
                    onClick={() => toggleActiveMutation.mutate({ id: re.id, isActive: !re.isActive })}
                  >
                    {re.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(re)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingId(re.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deletingId !== null} onOpenChange={(open) => { if (!open) setDeletingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This won't delete previously generated expenses, but no new ones will be created.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && deleteMutation.mutate(deletingId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
