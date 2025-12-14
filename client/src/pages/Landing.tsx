import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DollarSign, PieChart, Receipt, TrendingUp } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between gap-4 p-4 border-b h-16">
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">ExpenseTracker</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button asChild data-testid="button-login">
            <a href="/api/login">Sign In</a>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">
            Track Your Expenses with Ease
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Keep track of your daily spending, categorize expenses, scan receipts, and gain insights into your financial habits.
          </p>
          <Button size="lg" asChild data-testid="button-get-started">
            <a href="/api/login">Get Started</a>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <DollarSign className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Track Expenses</CardTitle>
              <CardDescription>
                Log your daily expenses quickly and easily with detailed categorization.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Receipt className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Scan Receipts</CardTitle>
              <CardDescription>
                Upload receipt images and let AI extract expense details automatically.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <PieChart className="h-10 w-10 text-primary mb-2" />
              <CardTitle>View Analytics</CardTitle>
              <CardDescription>
                Visualize your spending patterns with interactive charts and reports.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Track Trends</CardTitle>
              <CardDescription>
                Monitor spending trends over time to make smarter financial decisions.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}
