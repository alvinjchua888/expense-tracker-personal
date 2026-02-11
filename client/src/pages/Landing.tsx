import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DollarSign, PieChart, Receipt, TrendingUp, LogIn, UserPlus, AlertCircle } from "lucide-react";

export default function Landing() {
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [error, setError] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || "Login failed");
      }
      return res.json();
    },
    onSuccess: () => {
      setError("");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; email?: string; firstName?: string; lastName?: string }) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || "Registration failed");
      }
      return res.json();
    },
    onSuccess: () => {
      setError("");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ username: loginUsername, password: loginPassword });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    registerMutation.mutate({
      username: regUsername,
      password: regPassword,
      email: regEmail || undefined,
      firstName: regFirstName || undefined,
      lastName: regLastName || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between gap-4 p-4 border-b h-16">
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">ExpenseTracker</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left: Hero + Features */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-4">
                Track Your Expenses with Ease
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                Keep track of your daily spending, categorize expenses, scan receipts, and gain insights into your financial habits.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <DollarSign className="h-8 w-8 text-primary mb-1" />
                  <CardTitle className="text-base">Track Expenses</CardTitle>
                  <CardDescription className="text-sm">
                    Log expenses with detailed categorization.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <Receipt className="h-8 w-8 text-primary mb-1" />
                  <CardTitle className="text-base">Scan Receipts</CardTitle>
                  <CardDescription className="text-sm">
                    AI extracts expense details from photos.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <PieChart className="h-8 w-8 text-primary mb-1" />
                  <CardTitle className="text-base">View Analytics</CardTitle>
                  <CardDescription className="text-sm">
                    Interactive charts and spending reports.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <TrendingUp className="h-8 w-8 text-primary mb-1" />
                  <CardTitle className="text-base">Track Trends</CardTitle>
                  <CardDescription className="text-sm">
                    Monitor spending trends over time.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* Right: Auth Forms */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Welcome</CardTitle>
                <CardDescription>Sign in or create an account to get started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <Tabs defaultValue="login" onValueChange={() => setError("")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Sign In</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="space-y-4 mt-4">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-username">Username</Label>
                        <Input
                          id="login-username"
                          placeholder="Enter your username"
                          value={loginUsername}
                          onChange={(e) => setLoginUsername(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="Enter your password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loginMutation.isPending}
                      >
                        <LogIn className="h-4 w-4 mr-2" />
                        {loginMutation.isPending ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="register" className="space-y-4 mt-4">
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reg-username">Username *</Label>
                        <Input
                          id="reg-username"
                          placeholder="Choose a username"
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                          required
                          minLength={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-password">Password *</Label>
                        <Input
                          id="reg-password"
                          type="password"
                          placeholder="At least 6 characters"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-email">Email</Label>
                        <Input
                          id="reg-email"
                          type="email"
                          placeholder="Optional"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="reg-first">First Name</Label>
                          <Input
                            id="reg-first"
                            placeholder="Optional"
                            value={regFirstName}
                            onChange={(e) => setRegFirstName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reg-last">Last Name</Label>
                          <Input
                            id="reg-last"
                            placeholder="Optional"
                            value={regLastName}
                            onChange={(e) => setRegLastName(e.target.value)}
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={registerMutation.isPending}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {registerMutation.isPending ? "Creating account..." : "Create Account"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                <div className="relative">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                    or
                  </span>
                </div>

                <Button variant="outline" className="w-full" asChild>
                  <a href="/api/login">Sign in with Replit</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
