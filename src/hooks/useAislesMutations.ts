import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AisleInput {
  name: string;
  aisle_number: number;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
}

export function useCreateAisle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (aisle: AisleInput) => {
      const { data, error } = await supabase
        .from('aisles')
        .insert(aisle)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aisles'] });
    },
  });
}

export function useUpdateAisle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...aisle }: AisleInput & { id: string }) => {
      const { data, error } = await supabase
        .from('aisles')
        .update(aisle)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aisles'] });
    },
  });
}

export function useDeleteAisle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('aisles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aisles'] });
    },
  });
}
