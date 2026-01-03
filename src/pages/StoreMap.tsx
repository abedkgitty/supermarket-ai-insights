import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StoreMap } from '@/components/store/StoreMap';

const StoreMapPage = () => {
  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-display">Store Map</h1>
          <p className="text-muted-foreground mt-1">
            Visual top-down view of your store layout and product locations
          </p>
        </div>

        {/* Store Map */}
        <StoreMap />
      </motion.div>
    </DashboardLayout>
  );
};

export default StoreMapPage;
