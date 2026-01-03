import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AIPredictionsPanel } from '@/components/dashboard/AIPredictionsPanel';
import { useAIPredictions, useFinancialSummary } from '@/hooks/useFinancials';
import { useProducts } from '@/hooks/useProducts';
import { Brain, TrendingUp, Target, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';

const COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const AIInsightsPage = () => {
  const { data: predictions } = useAIPredictions();
  const { data: financials } = useFinancialSummary();
  const { data: products } = useProducts();

  // Calculate AI insights
  const lowStockProducts = products?.filter(p => p.stock_quantity <= p.min_stock_level) || [];
  const highMarginProducts = products?.filter(p => {
    const margin = (Number(p.selling_price) - Number(p.cost_price)) / Number(p.selling_price);
    return margin > 0.4;
  }) || [];

  // Revenue forecast data
  const forecastData = financials?.slice(-6).map((f, i) => ({
    month: format(parseISO(f.month), 'MMM'),
    actual: Number(f.total_sales),
    predicted: Number(f.total_sales) * (1 + 0.03 * (i + 1)),
  })) || [];

  // Category distribution
  const categoryData = [
    { name: 'Produce', value: 28 },
    { name: 'Dairy', value: 22 },
    { name: 'Meat', value: 18 },
    { name: 'Beverages', value: 15 },
    { name: 'Snacks', value: 10 },
    { name: 'Other', value: 7 },
  ];

  const insights = [
    {
      icon: TrendingUp,
      title: 'Revenue Optimization',
      description: 'Based on sales patterns, consider increasing inventory for Frozen Foods section.',
      type: 'success',
    },
    {
      icon: AlertCircle,
      title: 'Low Stock Alert',
      description: `${lowStockProducts.length} products are below minimum stock levels.`,
      type: 'warning',
    },
    {
      icon: Target,
      title: 'High Margin Products',
      description: `${highMarginProducts.length} products have margins above 40%. Consider promotional focus.`,
      type: 'info',
    },
    {
      icon: Zap,
      title: 'Demand Forecast',
      description: 'Predicted 18% growth in Q1 2026 based on historical trends.',
      type: 'success',
    },
  ];

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
            <h1 className="text-3xl font-bold font-display">AI Insights</h1>
            <p className="text-muted-foreground mt-1">
              Machine learning-powered business intelligence
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-accent text-white">
            <Brain className="h-5 w-5" />
            <span className="text-sm font-medium">AI Model: Active</span>
          </div>
        </div>

        {/* AI Insights Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`glass-card p-4 border-l-4 ${
                  insight.type === 'success' ? 'border-l-success' :
                  insight.type === 'warning' ? 'border-l-warning' :
                  'border-l-primary'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    insight.type === 'success' ? 'bg-success/10 text-success' :
                    insight.type === 'warning' ? 'bg-warning/10 text-warning' :
                    'bg-primary/10 text-primary'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Forecast */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-semibold font-display mb-4">Revenue Forecast</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="hsl(217, 91%, 50%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(217, 91%, 50%)' }}
                    name="Actual"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="hsl(173, 80%, 40%)" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: 'hsl(173, 80%, 40%)' }}
                    name="Predicted"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span>Actual Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <span>AI Prediction</span>
              </div>
            </div>
          </motion.div>

          {/* Category Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-semibold font-display mb-4">Sales by Category</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* AI Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-white">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold font-display">AI Recommendations</h3>
              <p className="text-sm text-muted-foreground">Actionable insights for your business</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-xl bg-success/10 border border-success/20">
              <h4 className="font-semibold text-success mb-2">Stock Optimization</h4>
              <p className="text-sm text-muted-foreground">
                Increase Organic Bananas inventory by 20% to meet predicted January demand surge.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <h4 className="font-semibold text-primary mb-2">Pricing Strategy</h4>
              <p className="text-sm text-muted-foreground">
                Consider 5% price increase on premium dairy products - demand remains inelastic.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
              <h4 className="font-semibold text-warning mb-2">Seasonal Planning</h4>
              <p className="text-sm text-muted-foreground">
                Prepare for 35% increase in frozen food sales during summer months.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Detailed Predictions */}
        <AIPredictionsPanel />
      </motion.div>
    </DashboardLayout>
  );
};

export default AIInsightsPage;
