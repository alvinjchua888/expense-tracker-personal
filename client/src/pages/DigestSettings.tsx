import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCurrency } from "@/hooks/useCurrency";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Send, Eye, Save, TrendingUp, TrendingDown, AlertTriangle, ShoppingBag } from "lucide-react";

interface DigestPrefs {
  id?: number;
  enabled: boolean;
  frequency: string;
  includeCategories: boolean;
  includeBudgetAlerts: boolean;
  includeTopMerchants: boolean;
  email: string | null;
  lastSentAt?: string | null;
}

interface DigestContent {
  summary: { totalSpending: number; avgPerDay: number; transactionCount: number; highestExpense: number };
  trend: { currentMonth: number; previousMonth: number; percentChange: number };
  categories: { name: string; total: number }[];
  budgetAlerts: { categoryName: string; spent: number; monthlyLimit: number; percentage: number }[];
  topMerchants: { merchant: string; count: number; total: number }[];
  generatedAt: string;
}

export default function DigestSettings() {
  const { toast } = useToast();
  const { formatAmount } = useCurrency();

  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequency] = useState("weekly");
  const [includeCategories, setIncludeCategories] = useState(true);
  const [includeBudgetAlerts, setIncludeBudgetAlerts] = useState(true);
  const [includeTopMerchants, setIncludeTopMerchants] = useState(true);
  const [email, setEmail] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const { data: prefs, isLoading: prefsLoading } = useQuery<DigestPrefs>({
    queryKey: ["/api/digest/preferences"],
  });

  // Sync form state when prefs load
  useEffect(() => {
    if (prefs) {
      setEnabled(prefs.enabled);
      setFrequency(prefs.frequency || "weekly");
      setIncludeCategories(prefs.includeCategories);
      setIncludeBudgetAlerts(prefs.includeBudgetAlerts);
      setIncludeTopMerchants(prefs.includeTopMerchants);
      setEmail(prefs.email || "");
      setHasChanges(false);
    }
  }, [prefs]);

  // Fetch preview
  const { data: preview, isLoading: previewLoading, refetch: refetchPreview } = useQuery<DigestContent>({
    queryKey: ["/api/digest/preview", includeCategories, includeBudgetAlerts, includeTopMerchants],
    queryFn: async () => {
      const response = await fetch("/api/digest/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ includeCategories, includeBudgetAlerts, includeTopMerchants }),
      });
      if (!response.ok) throw new Error("Failed to fetch preview");
      return response.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<DigestPrefs>) => apiRequest("PUT", "/api/digest/preferences", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/digest/preferences"] });
      toast({ title: "Digest preferences saved" });
      setHasChanges(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/digest/send", { email });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.mailto) {
        window.open(data.mailto, "_blank");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/digest/preferences"] });
      toast({ title: "Digest ready to send", description: "Your email client should open with the digest." });
    },
    onError: (error: any) => {
      toast({ title: "Failed to send digest", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      enabled,
      frequency,
      includeCategories,
      includeBudgetAlerts,
      includeTopMerchants,
      email: email || null,
    });
  };

  const markChanged = () => setHasChanges(true);

  const trendIcon = preview && preview.trend.percentChange >= 0
    ? <TrendingUp className="h-4 w-4 text-red-500" />
    : <TrendingDown className="h-4 w-4 text-green-500" />;

  if (prefsLoading) {
    return (
      <div className="space-y-6" data-testid="digest-settings-page">
        <div>
          <h1 className="text-3xl font-bold">Spending Digest</h1>
          <p className="text-muted-foreground">Configure your spending digest reports</p>
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="digest-settings-page">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Spending Digest</h1>
          <p className="text-muted-foreground">
            Get regular summaries of your spending delivered to your email
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => sendMutation.mutate()}
            disabled={!email || sendMutation.isPending}
          >
            <Send className="h-4 w-4 mr-2" />
            Send Test Digest
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saveMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Digest Settings</CardTitle>
              <CardDescription>Choose how often and what to include in your digest</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Enable Digest</Label>
                  <p className="text-sm text-muted-foreground">Receive spending summaries via email</p>
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={(checked) => { setEnabled(checked); markChanged(); }}
                />
              </div>

              <Separator />

              {/* Frequency */}
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={frequency} onValueChange={(v) => { setFrequency(v); markChanged(); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {frequency === "daily"
                    ? "You'll receive a digest every day with the previous day's spending"
                    : "You'll receive a digest every week with the past week's spending"}
                </p>
              </div>

              <Separator />

              {/* Email */}
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); markChanged(); }}
                />
                <p className="text-xs text-muted-foreground">Where to send your spending digest</p>
              </div>

              <Separator />

              {/* Content Toggles */}
              <div className="space-y-4">
                <Label className="text-base">Include in Digest</Label>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Category Breakdown</p>
                    <p className="text-xs text-muted-foreground">Top 5 spending categories</p>
                  </div>
                  <Switch
                    checked={includeCategories}
                    onCheckedChange={(checked) => { setIncludeCategories(checked); markChanged(); }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Budget Alerts</p>
                    <p className="text-xs text-muted-foreground">Categories nearing or over budget</p>
                  </div>
                  <Switch
                    checked={includeBudgetAlerts}
                    onCheckedChange={(checked) => { setIncludeBudgetAlerts(checked); markChanged(); }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Top Merchants</p>
                    <p className="text-xs text-muted-foreground">Most frequently visited merchants</p>
                  </div>
                  <Switch
                    checked={includeTopMerchants}
                    onCheckedChange={(checked) => { setIncludeTopMerchants(checked); markChanged(); }}
                  />
                </div>
              </div>

              {prefs?.lastSentAt && (
                <>
                  <Separator />
                  <p className="text-xs text-muted-foreground">
                    Last sent: {new Date(prefs.lastSentAt).toLocaleString()}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Digest Preview</h2>
            <Badge variant="secondary" className="capitalize">{frequency}</Badge>
          </div>

          {previewLoading ? (
            <Skeleton className="h-96" />
          ) : preview ? (
            <div className="space-y-4">
              {/* Summary Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Spending Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Spent</p>
                      <p className="text-xl font-bold">{formatAmount(preview.summary.totalSpending)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transactions</p>
                      <p className="text-xl font-bold">{preview.summary.transactionCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg per Day</p>
                      <p className="text-lg font-semibold">{formatAmount(preview.summary.avgPerDay)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Highest</p>
                      <p className="text-lg font-semibold">{formatAmount(preview.summary.highestExpense)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trend Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {trendIcon}
                    Monthly Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">This Month</p>
                      <p className="text-lg font-semibold">{formatAmount(preview.trend.currentMonth)}</p>
                    </div>
                    <span className="text-muted-foreground">vs</span>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Month</p>
                      <p className="text-lg font-semibold">{formatAmount(preview.trend.previousMonth)}</p>
                    </div>
                    <Badge variant={preview.trend.percentChange >= 0 ? "destructive" : "default"}>
                      {preview.trend.percentChange >= 0 ? "+" : ""}{preview.trend.percentChange.toFixed(1)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Categories Card */}
              {includeCategories && preview.categories.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Top Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {preview.categories.map((cat) => {
                        const total = preview.categories.reduce((s, c) => s + c.total, 0);
                        const pct = total > 0 ? ((cat.total / total) * 100).toFixed(1) : "0";
                        return (
                          <div key={cat.name} className="flex items-center justify-between">
                            <span className="text-sm">{cat.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{formatAmount(cat.total)}</span>
                              <Badge variant="outline" className="text-xs">{pct}%</Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Budget Alerts Card */}
              {includeBudgetAlerts && preview.budgetAlerts.length > 0 && (
                <Card className="border-yellow-500/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      Budget Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {preview.budgetAlerts.map((alert) => (
                        <div key={alert.categoryName} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={alert.percentage >= 100 ? "destructive" : "secondary"} className="text-xs">
                              {alert.percentage}%
                            </Badge>
                            <span className="text-sm">{alert.categoryName}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatAmount(alert.spent)} / {formatAmount(alert.monthlyLimit)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Merchants Card */}
              {includeTopMerchants && preview.topMerchants.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      Top Merchants
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {preview.topMerchants.map((m) => (
                        <div key={m.merchant} className="flex items-center justify-between">
                          <span className="text-sm">{m.merchant}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{m.count}x</Badge>
                            <span className="text-sm font-medium">{formatAmount(m.total)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No data state */}
              {preview.summary.transactionCount === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Mail className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-center">
                      No expense data yet. Add some expenses to see your digest preview.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
