import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FinancialSummary {
  id: string;
  month: string;
  total_sales: number;
  total_costs: number;
  total_profit: number;
  total_items_sold: number;
  created_at: string;
}

export interface Sale {
  id: string;
  product_id: string;
  quantity: number;
  total_amount: number;
  sale_date: string;
  created_at: string;
}

export interface AIPrediction {
  id: string;
  product_id: string;
  predicted_demand: number;
  predicted_revenue: number;
  prediction_month: string;
  confidence_score: number;
  created_at: string;
  products?: { name: string } | null;
}

export function useFinancialSummary() {
  return useQuery({
    queryKey: ['financial-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_summary')
        .select('*')
        .order('month', { ascending: true });
      
      if (error) throw error;
      return data as FinancialSummary[];
    },
  });
}

export function useSales() {
  return useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('sale_date', { ascending: false });
      
      if (error) throw error;
      return data as Sale[];
    },
  });
}

export function useAIPredictions() {
  return useQuery({
    queryKey: ['ai-predictions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_predictions')
        .select(`
          *,
          products (name)
        `)
        .order('prediction_month');
      
      if (error) throw error;
      return data as AIPrediction[];
    },
  });
}
