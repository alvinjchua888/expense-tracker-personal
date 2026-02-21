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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Trash2, Pencil, Target, Calendar, PlusCircle, History, TrendingUp, Star } from "lucide-react";
import type { Category, SavingsGoal, GoalContribution } from "@shared/schema";

const GOAL_ICONS = ["🎯", "💰", "🏠", "✈️", "🚗", "📱", "💍", "🎓", "🏥", "🎁"];
const GOAL_COLORS = ["#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899"];
const MILESTONES = [25, 50, 75, 100];

function getMilestoneColor(progress: number): string {
  if (progress >= 100) return "#10B981";
  if (progress >= 75) return "#3B82F6";
  if (progress >= 50) return "#F59E0B";
  if (progress >= 25) return "#8B5CF6";
  return "#6B7280";
}

export default function Goals() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<number | null>(null);
  const [contributionGoalId, setContributionGoalId] = useState<number | null>(null);
  const [historyGoalId, setHistoryGoalId] = useState<number | null>(null);
  const [contribAmount, setContribAmount] = useState("");
  const [contribNote, setContribNote] = useState("");
  const [formData, setFormData] = useState({
    name: "", targetAmount: "", targetDate: "",
    icon: "🎯", color: "#3B82F6", linkedCategoryId: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { symbol } = useCurrency();

  const { data: goals = [], isLoading } = useQuery<SavingsGoal[]>({ queryKey: ["/api/goals"] });
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });
  const { data: contributions = [] } = useQuery<GoalContribution[]>({
    queryKey: ["/api/goals", historyGoalId, "contributions"],
    queryFn: async () => {
      if (!historyGoalId) return [];
      const res = await fetch(`/api/goals/${historyGoalId}/contributions`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: historyGoalId !== null,
  });

  const createGoalMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/goals", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({ title: "Goal created!" });
      resetForm();
    },
    onError: (error: any) => {
      const message = error?.message || "";
      if (message.includes("Maximum 10 goals"))
        toast({ title: "Maximum 10 goals reached", variant: "destructive" });
      else
        toast({ title: "Failed to create goal", description: message, variant: "destructive" });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PUT", `/api/goals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({ title: "Goal updated" });
      resetForm();
    },
    onError: (error: any) =>
      toast({ title: "Failed to update goal", description: error.message, variant: "destructive" }),
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/goals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({ title: "Goal deleted" });
      setDeletingGoalId(null);
    },
  });

  const addContributionMutation = useMutation({
    mutationFn: ({ goalId, amount, note }: { goalId: number; amount: number; note?: string }) =>
      apiRequest("POST", `/api/goals/${goalId}/contributions`, { amount, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      if (historyGoalId)
        queryClient.invalidateQueries({ queryKey: ["/api/goals", historyGoalId, "contributions"] });
      setContributionGoalId(null);
      setContribAmount("");
      setContribNote("");
      toast({ title: "Contribution added!" });
    },
    onError: (error: any) =>
      toast({ title: "Failed to add contribution", description: error.message, variant: "destructive" }),
  });

  const deleteContributionMutation = useMutation({
    mutationFn: ({ goalId, contribId }: { goalId: number; contribId: number }) =>
      apiRequest("DELETE", `/api/goals/${goalId}/contributions/${contribId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      if (historyGoalId)
        queryClient.invalidateQueries({ queryKey: ["/api/goals", historyGoalId, "contributions"] });
      toast({ title: "Contribution removed" });
    },
  });

  const resetForm = () => {
    setDialogOpen(false);
    setEditingGoal(null);
    setFormData({ name: "", targetAmount: "", targetDate: "", icon: "🎯", color: "#3B82F6", linkedCategoryId: "" });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    else if (formData.name.length > 100) errors.name = "Name must be 100 characters or less";
    const amount = parseFloat(formData.targetAmount);
    if (isNaN(amount) || amount <= 0) errors.targetAmount = "Target must be positive";
    else if (amount > 999999999) errors.targetAmount = "Amount too large";
    if (!formData.targetDate) errors.targetDate = "Target date is required";
    else if (new Date(formData.targetDate) <= new Date())
      errors.targetDate = "Target date must be in the future";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const data = {
      name: formData.name.trim(),
      targetAmount: parseFloat(formData.targetAmount),
      targetDate: formData.targetDate,
      icon: formData.icon,
      color: formData.color,
      linkedCategoryId: formData.linkedCategoryId ? parseInt(formData.linkedCategoryId) : null,
    };
    if (editingGoal) updateGoalMutation.mutate({ id: editingGoal.id, ...data });
    else createGoalMutation.mutate(data);
  };

  const handleEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      targetDate: new Date(goal.targetDate).toISOString().split("T")[0],
      icon: goal.icon || "🎯",
      color: goal.color || "#3B82F6",
      linkedCategoryId: goal.linkedCategoryId?.toString() || "",
    });
    setDialogOpen(true);
  };

  const handleAddContribution = () => {
    if (!contributionGoalId) return;
    const amount = parseFloat(contribAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }
    addContributionMutation.mutate({ goalId: contributionGoalId, amount, note: contribNote.trim() || undefined });
  };

  const getProgress = (current: number, target: number) =>
    target <= 0 ? 0 : Math.min(100, Math.round((current / target) * 100));
  const getDaysRemaining = (targetDate: Date) =>
    Math.ceil((new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const getNextMilestone = (progress: number) => MILESTONES.find(m => m > progress) || null;
  const historyGoal = goals.find(g => g.id === historyGoalId) || null;

  return (
    <div className="space-y-6" data-testid="goals-page">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Savings Goals</h1>
          <p className="text-muted-foreground">Track your progress toward financial objectives</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setDialogOpen(true); }}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <DialogTrigger asChild>
                    <Button disabled={goals.length >= 10}>
                      <Plus className="h-4 w-4 mr-2" />Create Goal
                    </Button>
                  </DialogTrigger>
                </span>
              </TooltipTrigger>
              {goals.length >= 10 && (
                <TooltipContent><p>Maximum 10 goals reached</p></TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGoal ? "Edit Goal" : "Create Savings Goal"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Vacation Fund"
                  maxLength={100}
                />
                {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label>Target Amount *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{symbol}</span>
                  <Input
                    type="number" step="0.01" min="0.01"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    placeholder="0.00" className="pl-8"
                  />
                </div>
                {formErrors.targetAmount && <p className="text-sm text-red-500">{formErrors.targetAmount}</p>}
              </div>
              <div className="space-y-2">
                <Label>Target Date *</Label>
                <Input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                />
                {formErrors.targetDate && <p className="text-sm text-red-500">{formErrors.targetDate}</p>}
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex gap-2 flex-wrap">
                  {GOAL_ICONS.map((icon) => (
                    <button
                      key={icon} type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`w-10 h-10 text-xl rounded-md border-2 transition-colors ${
                        formData.icon === icon
                          ? "border-primary bg-primary/10"
                          : "border-muted hover:border-muted-foreground"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {GOAL_COLORS.map((color) => (
                    <button
                      key={color} type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        formData.color === color ? "border-foreground scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Link to Category (optional)</Label>
                <Select
                  value={formData.linkedCategoryId}
                  onValueChange={(val) => setFormData({ ...formData, linkedCategoryId: val })}
                >
                  <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button
                  type="submit"
                  disabled={createGoalMutation.isPending || updateGoalMutation.isPending}
                >
                  {editingGoal ? "Save Changes" : "Create Goal"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : goals.length === 0 ? (
        <Card className="p-12 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No savings goals yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first goal to start tracking your savings progress
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />Create Goal
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const progress = getProgress(goal.currentAmount, goal.targetAmount);
            const daysRemaining = getDaysRemaining(new Date(goal.targetDate));
            const remaining = goal.targetAmount - goal.currentAmount;
            const milestoneColor = getMilestoneColor(progress);
            const nextMilestone = getNextMilestone(progress);
            const isComplete = progress >= 100;
            return (
              <Card key={goal.id} className="relative overflow-hidden transition-all hover:shadow-md">
                <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: goal.color || "#3B82F6" }} />
                {isComplete && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-500 text-white text-xs">
                      <Star className="h-3 w-3 mr-1" />Completed!
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{goal.icon || "🎯"}</span>
                      <CardTitle className="text-lg leading-tight">{goal.name}</CardTitle>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => setHistoryGoalId(goal.id)}>
                        <History className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(goal)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletingGoalId(goal.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{symbol}{goal.currentAmount.toFixed(2)}</span>
                      <span className="text-muted-foreground">of {symbol}{goal.targetAmount.toFixed(2)}</span>
                    </div>
                    <div className="relative">
                      <Progress value={progress} className="h-3" />
                      <div className="absolute top-0 left-0 right-0 h-3 pointer-events-none">
                        {[25, 50, 75].map((m) => (
                          <div
                            key={m}
                            className={`absolute top-0 bottom-0 w-0.5 ${
                              progress >= m ? "bg-white/40" : "bg-border/60"
                            }`}
                            style={{ left: `${m}%` }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span style={{ color: milestoneColor }} className="font-medium">{progress}% complete</span>
                      {remaining > 0 && (
                        <span className="text-muted-foreground">{symbol}{remaining.toFixed(2)} remaining</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {MILESTONES.map((m) => (
                      <span
                        key={m}
                        className={`text-xs px-1.5 py-0.5 rounded-full border ${
                          progress >= m
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-muted border-border text-muted-foreground"
                        }`}
                      >
                        {m}%
                      </span>
                    ))}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {daysRemaining > 0
                          ? `${daysRemaining} days remaining`
                          : daysRemaining === 0
                          ? "Due today"
                          : `${Math.abs(daysRemaining)} days overdue`}
                      </span>
                    </div>
                    {nextMilestone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          Next: {nextMilestone}% ({symbol}
                          {((goal.targetAmount * nextMilestone / 100) - goal.currentAmount).toFixed(2)} away)
                        </span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline" size="sm" className="w-full"
                    onClick={() => setContributionGoalId(goal.id)}
                    disabled={isComplete}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />Add Contribution
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Contribution Dialog */}
      <Dialog
        open={contributionGoalId !== null}
        onOpenChange={(open) => {
          if (!open) { setContributionGoalId(null); setContribAmount(""); setContribNote(""); }
        }}
      >
        <DialogContent>
          <DialogHeader><DialogTitle>Add Contribution</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{symbol}</span>
                <Input
                  type="number" step="0.01" min="0.01"
                  value={contribAmount}
                  onChange={(e) => setContribAmount(e.target.value)}
                  placeholder="0.00" className="pl-8" autoFocus
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Input
                value={contribNote}
                onChange={(e) => setContribNote(e.target.value)}
                placeholder="e.g., Monthly savings"
                maxLength={500}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => { setContributionGoalId(null); setContribAmount(""); setContribNote(""); }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddContribution} disabled={addContributionMutation.isPending}>
                Add Contribution
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contribution History Dialog */}
      <Dialog
        open={historyGoalId !== null}
        onOpenChange={(open) => { if (!open) setHistoryGoalId(null); }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {historyGoal ? `${historyGoal.name} - History` : "Contribution History"}
            </DialogTitle>
          </DialogHeader>
          {contributions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No contributions yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {contributions.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{symbol}{c.amount.toFixed(2)}</p>
                    {c.note && <p className="text-xs text-muted-foreground">{c.note}</p>}
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() =>
                      historyGoalId &&
                      deleteContributionMutation.mutate({ goalId: historyGoalId, contribId: c.id })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-sm text-muted-foreground">
              {contributions.length} contribution{contributions.length !== 1 ? "s" : ""}
            </span>
            <Button
              variant="outline" size="sm"
              onClick={() => {
                if (historyGoalId) {
                  setContributionGoalId(historyGoalId);
                  setHistoryGoalId(null);
                }
              }}
            >
              <PlusCircle className="h-4 w-4 mr-1" />Add More
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Goal Dialog */}
      <AlertDialog open={deletingGoalId !== null} onOpenChange={() => setDeletingGoalId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this goal?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. All contributions and progress will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingGoalId && deleteGoalMutation.mutate(deletingGoalId)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
