import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Sale {
  id: string;
  product_id: string | null;
  quantity: number;
  total_amount: number;
  sale_date: string;
  created_at: string;
  products?: { name: string; sku: string } | null;
}

export interface SaleInput {
  product_id: string;
  quantity: number;
  total_amount: number;
  sale_date?: string;
}

export function useSales() {
  return useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          products (name, sku)
        `)
        .order('sale_date', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as Sale[];
    },
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sale: SaleInput) => {
      const { data, error } = await supabase
        .from('sales')
        .insert(sale)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['financials'] });
    },
  });
}

export function useDeleteSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['financials'] });
    },
  });
}
