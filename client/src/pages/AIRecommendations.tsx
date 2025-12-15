import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingDown, Lightbulb, RefreshCw } from "lucide-react";

interface AIRecommendationResponse {
  analysis: string;
  recommendations: string[];
}

export default function AIRecommendations() {
  const [data, setData] = useState<AIRecommendationResponse | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/recommendations");
      return response.json();
    },
    onMutate: () => {
      setData(null);
    },
    onSuccess: (response: AIRecommendationResponse) => {
      setData(response);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">AI Recommendations</h1>
          <p className="text-muted-foreground">
            Get personalized insights and tips to optimize your spending
          </p>
        </div>
        <Button 
          onClick={() => mutation.mutate()} 
          disabled={mutation.isPending}
          data-testid="button-generate-recommendations"
        >
          {mutation.isPending ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Recommendations
            </>
          )}
        </Button>
      </div>

      {!data && !mutation.isPending && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Ready for AI Analysis</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Click the button above to analyze your spending patterns and get personalized recommendations to help you save money.
            </p>
          </CardContent>
        </Card>
      )}

      {mutation.isPending && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-12 w-12 text-primary mb-4 animate-spin" />
            <h3 className="text-lg font-medium mb-2">Analyzing Your Spending</h3>
            <p className="text-muted-foreground text-center">
              Our AI is reviewing your expense history...
            </p>
          </CardContent>
        </Card>
      )}

      {data && !mutation.isPending && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-primary" />
                Spending Analysis
              </CardTitle>
              <CardDescription>AI-generated insights based on your expense history</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-foreground" data-testid="text-analysis">{data.analysis}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Top Recommendations
              </CardTitle>
              <CardDescription>Actionable tips to reduce your spending</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {data.recommendations.map((rec, index) => (
                  <li 
                    key={index} 
                    className="flex gap-3 p-3 rounded-lg bg-muted/50"
                    data-testid={`text-recommendation-${index}`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      {index + 1}
                    </span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {mutation.isError && (
        <Card className="border-destructive">
          <CardContent className="py-6">
            <p className="text-destructive text-center">
              Failed to generate recommendations. Please try again.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
