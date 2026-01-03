import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export interface SaleWithProduct {
  id: string;
  product_id: string;
  quantity: number;
  total_amount: number;
  sale_date: string;
  created_at: string;
  products: {
    name: string;
    sku: string;
    selling_price: number;
    category_id: string;
    categories: {
      name: string;
      color: string;
    } | null;
  } | null;
}

export interface DailySalesPattern {
  day: string;
  sales: number;
  transactions: number;
}

export interface CategorySalesData {
  name: string;
  sales: number;
  quantity: number;
  color: string;
}

export interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
  category: string;
}

export function useSalesWithProducts() {
  return useQuery({
    queryKey: ['sales-with-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          products (
            name,
            sku,
            selling_price,
            category_id,
            categories (
              name,
              color
            )
          )
        `)
        .order('sale_date', { ascending: false });
      
      if (error) throw error;
      return data as SaleWithProduct[];
    },
  });
}

export function useSalesAnalytics() {
  const { data: sales, isLoading, error } = useSalesWithProducts();

  const analytics = sales ? calculateAnalytics(sales) : null;

  return {
    sales,
    analytics,
    isLoading,
    error,
  };
}

function calculateAnalytics(sales: SaleWithProduct[]) {
  // Daily sales pattern (by day of week)
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dailyPattern: DailySalesPattern[] = dayNames.map(day => ({
    day: day.slice(0, 3),
    sales: 0,
    transactions: 0,
  }));

  // Category breakdown
  const categoryMap = new Map<string, { sales: number; quantity: number; color: string }>();

  // Product breakdown
  const productMap = new Map<string, { quantity: number; revenue: number; category: string }>();

  // Monthly trends
  const monthlyMap = new Map<string, { sales: number; transactions: number }>();

  // Top transactions (simulating "top customers" as top individual transactions)
  const topTransactions: { date: string; amount: number; items: number; product: string }[] = [];

  sales.forEach(sale => {
    const date = parseISO(sale.sale_date);
    const dayIndex = date.getDay();
    const monthKey = format(date, 'yyyy-MM');

    // Daily pattern
    dailyPattern[dayIndex].sales += Number(sale.total_amount);
    dailyPattern[dayIndex].transactions += 1;

    // Monthly trends
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, { sales: 0, transactions: 0 });
    }
    const monthly = monthlyMap.get(monthKey)!;
    monthly.sales += Number(sale.total_amount);
    monthly.transactions += 1;

    // Category breakdown
    if (sale.products?.categories) {
      const catName = sale.products.categories.name;
      const catColor = sale.products.categories.color;
      if (!categoryMap.has(catName)) {
        categoryMap.set(catName, { sales: 0, quantity: 0, color: catColor });
      }
      const cat = categoryMap.get(catName)!;
      cat.sales += Number(sale.total_amount);
      cat.quantity += sale.quantity;
    }

    // Product breakdown
    if (sale.products) {
      const prodName = sale.products.name;
      if (!productMap.has(prodName)) {
        productMap.set(prodName, {
          quantity: 0,
          revenue: 0,
          category: sale.products.categories?.name || 'Unknown',
        });
      }
      const prod = productMap.get(prodName)!;
      prod.quantity += sale.quantity;
      prod.revenue += Number(sale.total_amount);
    }

    // Track top transactions
    topTransactions.push({
      date: sale.sale_date,
      amount: Number(sale.total_amount),
      items: sale.quantity,
      product: sale.products?.name || 'Unknown',
    });
  });

  // Sort and get top 10 transactions
  topTransactions.sort((a, b) => b.amount - a.amount);
  const top10Transactions = topTransactions.slice(0, 10);

  // Category data sorted by sales
  const categoryData: CategorySalesData[] = Array.from(categoryMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.sales - a.sales);

  // Top products by quantity
  const topProducts: TopProduct[] = Array.from(productMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // Top products by revenue
  const topProductsByRevenue: TopProduct[] = Array.from(productMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Monthly trends data
  const monthlyTrends = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month: format(parseISO(month + '-01'), 'MMM yyyy'),
      ...data,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Summary stats
  const totalSales = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
  const totalTransactions = sales.length;
  const avgTransactionValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;
  const totalItemsSold = sales.reduce((sum, s) => sum + s.quantity, 0);

  return {
    dailyPattern,
    categoryData,
    topProducts,
    topProductsByRevenue,
    monthlyTrends,
    top10Transactions,
    summary: {
      totalSales,
      totalTransactions,
      avgTransactionValue,
      totalItemsSold,
    },
  };
}
