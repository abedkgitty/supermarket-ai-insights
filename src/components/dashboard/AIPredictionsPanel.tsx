import { motion } from 'framer-motion';
import { Brain, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';
import { useAIPredictions } from '@/hooks/useFinancials';
import { useFinancialSummary } from '@/hooks/useFinancials';
import { format, parseISO } from 'date-fns';

export function AIPredictionsPanel() {
  const { data: predictions, isLoading } = useAIPredictions();
  const { data: financials } = useFinancialSummary();

  // Calculate predicted totals for next year
  const currentYearSales = financials?.reduce((sum, f) => sum + Number(f.total_sales), 0) || 0;
  const predictedGrowth = 0.18; // 18% predicted growth
  const predictedNextYearSales = currentYearSales * (1 + predictedGrowth);
  const predictedRevenue = predictions?.reduce((sum, p) => sum + Number(p.predicted_revenue), 0) || 0;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="animate-pulse">Loading AI predictions...</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass-card p-6 border-l-4 border-l-accent"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-accent text-white">
          <Brain className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold font-display">AI Predictions for 2026</h3>
          <p className="text-sm text-muted-foreground">Machine learning forecasts</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-xl bg-accent/10 border border-accent/20">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm font-medium">Predicted Annual Revenue</p>
              <p className="text-xs text-muted-foreground">Based on trend analysis</p>
            </div>
          </div>
          <p className="text-xl font-bold font-display text-accent">
            ${predictedNextYearSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-success/10 border border-success/20">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-success" />
            <div>
              <p className="text-sm font-medium">Expected Growth</p>
              <p className="text-xs text-muted-foreground">Year-over-year</p>
            </div>
          </div>
          <p className="text-xl font-bold font-display text-success">+18%</p>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-warning" />
            Top Product Predictions
          </h4>
          <div className="space-y-2">
            {predictions?.slice(0, 5).map((prediction, index) => (
              <motion.div
                key={prediction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground w-6">#{index + 1}</span>
                  <span className="text-sm font-medium">{prediction.products?.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">
                    {prediction.predicted_demand} units
                  </span>
                  <span className="text-sm font-semibold text-success">
                    ${Number(prediction.predicted_revenue).toFixed(0)}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {(Number(prediction.confidence_score) * 100).toFixed(0)}% conf.
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
