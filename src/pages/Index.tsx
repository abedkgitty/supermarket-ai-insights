import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { SalesChart, CategorySalesChart } from '@/components/dashboard/Charts';
import { AIPredictionsPanel } from '@/components/dashboard/AIPredictionsPanel';
import { useFinancialSummary } from '@/hooks/useFinancials';
import { useProducts } from '@/hooks/useProducts';

const Index = () => {
  const { data: financials } = useFinancialSummary();
  const { data: products } = useProducts();

  // Calculate totals
  const totalSales = financials?.reduce((sum, f) => sum + Number(f.total_sales), 0) || 0;
  const totalCosts = financials?.reduce((sum, f) => sum + Number(f.total_costs), 0) || 0;
  const totalProfit = financials?.reduce((sum, f) => sum + Number(f.total_profit), 0) || 0;
  const totalItemsSold = financials?.reduce((sum, f) => sum + f.total_items_sold, 0) || 0;

  // Calculate changes (comparing last month to previous)
  const lastMonth = financials?.[financials.length - 1];
  const prevMonth = financials?.[financials.length - 2];
  const salesChange = lastMonth && prevMonth 
    ? ((Number(lastMonth.total_sales) - Number(prevMonth.total_sales)) / Number(prevMonth.total_sales) * 100).toFixed(1)
    : '0';
  const profitChange = lastMonth && prevMonth
    ? ((Number(lastMonth.total_profit) - Number(prevMonth.total_profit)) / Number(prevMonth.total_profit) * 100).toFixed(1)
    : '0';

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              AI-powered supermarket analytics for 2025
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 text-accent border border-accent/20">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-medium">AI Analysis Active</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Sales (YTD)"
            value={`$${totalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            change={`+${salesChange}% from last month`}
            changeType="positive"
            icon="sales"
            delay={0}
          />
          <MetricCard
            title="Total Costs (YTD)"
            value={`$${totalCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            change="Operating expenses"
            changeType="neutral"
            icon="costs"
            delay={0.1}
          />
          <MetricCard
            title="Net Profit (YTD)"
            value={`$${totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            change={`+${profitChange}% growth`}
            changeType="positive"
            icon="sales"
            delay={0.2}
          />
          <MetricCard
            title="Items Sold (YTD)"
            value={totalItemsSold.toLocaleString()}
            change={`${products?.length || 0} products in stock`}
            changeType="neutral"
            icon="items"
            delay={0.3}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SalesChart />
          <CategorySalesChart />
        </div>

        {/* AI Predictions */}
        <AIPredictionsPanel />
      </motion.div>
    </DashboardLayout>
  );
};

export default Index;
