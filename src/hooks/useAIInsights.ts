import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AIInsight {
  title: string;
  description: string;
  type: "revenue" | "inventory" | "growth" | "warning";
  priority: "high" | "medium" | "low";
}

interface AIInsightsResponse {
  insights: AIInsight[];
  metrics: {
    totalRevenue: number;
    totalCosts: number;
    totalProfit: number;
    profitMargin: string;
    topCategories: { name: string; revenue: number; salesCount: number }[];
    lowStockCount: number;
  };
}

export function useAIInsights() {
  return useQuery({
    queryKey: ["ai-insights"],
    queryFn: async (): Promise<AIInsightsResponse> => {
      const { data, error } = await supabase.functions.invoke("ai-insights");
      
      if (error) {
        console.error("AI insights error:", error);
        throw error;
      }
      
      return data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });
}
