import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: 'sales' | 'costs' | 'items' | 'ai';
  delay?: number;
}

const iconMap = {
  sales: DollarSign,
  costs: Package,
  items: ShoppingCart,
  ai: Brain,
};

const gradientMap = {
  sales: 'gradient-success',
  costs: 'gradient-warning',
  items: 'gradient-primary',
  ai: 'gradient-accent',
};

export function MetricCard({ title, value, change, changeType = 'neutral', icon, delay = 0 }: MetricCardProps) {
  const Icon = iconMap[icon];
  const gradient = gradientMap[icon];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="metric-card group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold font-display tracking-tight">{value}</p>
          {change && (
            <div className={cn(
              "mt-2 flex items-center gap-1 text-sm font-medium",
              changeType === 'positive' && "text-success",
              changeType === 'negative' && "text-destructive",
              changeType === 'neutral' && "text-muted-foreground"
            )}>
              {changeType === 'positive' && <TrendingUp className="h-4 w-4" />}
              {changeType === 'negative' && <TrendingDown className="h-4 w-4" />}
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl text-white transition-transform group-hover:scale-110",
          gradient
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  );
}
