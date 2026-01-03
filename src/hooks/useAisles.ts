import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Aisle {
  id: string;
  name: string;
  aisle_number: number;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  created_at: string;
}

export function useAisles() {
  return useQuery({
    queryKey: ['aisles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aisles')
        .select('*')
        .order('aisle_number');
      
      if (error) throw error;
      return data as Aisle[];
    },
  });
}
