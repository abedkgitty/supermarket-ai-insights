import { motion } from 'framer-motion';
import { Brain, TrendingUp, Sparkles, AlertCircle, Package, DollarSign, ArrowUp, RefreshCw } from 'lucide-react';
import { useAIInsights } from '@/hooks/useAIInsights';
import { Button } from '@/components/ui/button';

const typeIcons = {
  revenue: DollarSign,
  inventory: Package,
  growth: ArrowUp,
  warning: AlertCircle,
};

const typeColors = {
  revenue: 'text-success bg-success/10 border-success/20',
  inventory: 'text-warning bg-warning/10 border-warning/20',
  growth: 'text-accent bg-accent/10 border-accent/20',
  warning: 'text-destructive bg-destructive/10 border-destructive/20',
};

const priorityBadges = {
  high: 'bg-destructive/20 text-destructive',
  medium: 'bg-warning/20 text-warning',
  low: 'bg-muted text-muted-foreground',
};

export function AIPredictionsPanel() {
  const { data, isLoading, error, refetch, isFetching } = useAIInsights();

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3">
          <div className="animate-spin">
            <Brain className="h-5 w-5 text-accent" />
          </div>
          <span className="text-muted-foreground">AI is analyzing your data...</span>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 border-l-4 border-l-destructive"
      >
        <p className="text-destructive">Failed to load AI insights. Please try again.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
          Retry
        </Button>
      </motion.div>
    );
  }

  const insights = data?.insights || [];
  const metrics = data?.metrics;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass-card p-6 border-l-4 border-l-accent"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-accent text-white">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold font-display">AI Business Insights</h3>
            <p className="text-sm text-muted-foreground">Powered by real-time analysis</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => refetch()} 
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {metrics && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-center">
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="text-lg font-bold text-accent">
              ${(metrics.totalRevenue ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-success/10 border border-success/20 text-center">
            <p className="text-xs text-muted-foreground">Profit</p>
            <p className="text-lg font-bold text-success">
              ${(metrics.totalProfit ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-warning/10 border border-warning/20 text-center">
            <p className="text-xs text-muted-foreground">Low Stock</p>
            <p className="text-lg font-bold text-warning">
              {metrics.lowStockCount ?? 0} items
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          AI Recommendations
        </h4>
        {insights.map((insight, index) => {
          const Icon = typeIcons[insight.type] || AlertCircle;
          const colorClass = typeColors[insight.type] || typeColors.warning;
          const priorityClass = priorityBadges[insight.priority] || priorityBadges.medium;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className={`p-4 rounded-xl border ${colorClass}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${priorityClass}`}>
                  {insight.priority}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
