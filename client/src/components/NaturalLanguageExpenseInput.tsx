import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, invalidateExpenseRelatedQueries } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { Mic, MicOff, Sparkles, Check, X, Loader2 } from "lucide-react";
import type { Category } from "@shared/schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechRecognitionAPI: any =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

interface ParsedExpense {
  amount: number;
  merchant: string;
  description?: string;
  categoryId?: number;
  date?: string;
  currency?: string;
  confidence?: number;
}

interface NLExpenseInputProps {
  categories: Category[];
  onExpenseAdded?: () => void;
}

export function NaturalLanguageExpenseInput({ categories, onExpenseAdded }: NLExpenseInputProps) {
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [parsed, setParsed] = useState<ParsedExpense | null>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const { symbol } = useCurrency();

  const hasSpeechRecognition = SpeechRecognitionAPI !== null;

  const parseMutation = useMutation({
    mutationFn: (text: string): Promise<ParsedExpense> =>
      apiRequest("POST", "/api/expenses/parse-natural", { text }).then((r) => r.json()),
    onSuccess: (data: ParsedExpense) => {
      setParsed(data);
    },
    onError: (error: any) => {
      toast({
        title: "Could not parse input",
        description: error.message || "Please try again or enter manually",
        variant: "destructive",
      });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (expense: ParsedExpense): Promise<Response> =>
      apiRequest("POST", "/api/expenses", {
        amount: expense.amount,
        currency: expense.currency || "USD",
        merchant: expense.merchant,
        description: expense.description,
        categoryId: expense.categoryId,
        date: expense.date ? new Date(expense.date) : new Date(),
      }),
    onSuccess: () => {
      invalidateExpenseRelatedQueries();
      setParsed(null);
      setInputText("");
      toast({ title: "Expense added!" });
      onExpenseAdded?.();
    },
    onError: (error: any) => {
      toast({ title: "Failed to add expense", description: error.message, variant: "destructive" });
    },
  });

  const handleParse = () => {
    const text = inputText.trim();
    if (!text) return;
    parseMutation.mutate(text);
  };

  const handleVoice = useCallback(() => {
    if (!hasSpeechRecognition) {
      toast({ title: "Voice input not supported in this browser", variant: "destructive" });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsListening(false);
      parseMutation.mutate(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({ title: "Voice recognition failed", variant: "destructive" });
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, hasSpeechRecognition, toast, parseMutation]);

  const getCategoryName = (id?: number) =>
    categories.find((c) => c.id === id)?.name || "Uncategorized";

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder='Try: "Coffee at Starbucks for $5.50 yesterday"'
            onKeyDown={(e) => e.key === "Enter" && handleParse()}
            className="pr-10"
          />
          {isListening && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </div>
        {hasSpeechRecognition && (
          <Button
            variant={isListening ? "destructive" : "outline"}
            size="icon"
            onClick={handleVoice}
            title={isListening ? "Stop listening" : "Voice input"}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        )}
        <Button
          onClick={handleParse}
          disabled={!inputText.trim() || parseMutation.isPending}
          variant="outline"
        >
          {parseMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Parse
        </Button>
      </div>

      {parsed && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">
                    {symbol}{parsed.amount.toFixed(2)} at {parsed.merchant}
                  </p>
                  {parsed.confidence !== undefined && (
                    <Badge variant="outline" className="text-xs">
                      {Math.round(parsed.confidence * 100)}% confidence
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span>{getCategoryName(parsed.categoryId)}</span>
                  {parsed.description && <span>{parsed.description}</span>}
                  {parsed.date && (
                    <span>{new Date(parsed.date).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => confirmMutation.mutate(parsed)}
                  disabled={confirmMutation.isPending}
                >
                  {confirmMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setParsed(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
