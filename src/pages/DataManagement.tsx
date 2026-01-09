import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Tag, MapPin, Package } from 'lucide-react';
import { SalesManager } from '@/components/data-management/SalesManager';
import { CategoriesManager } from '@/components/data-management/CategoriesManager';
import { AislesManager } from '@/components/data-management/AislesManager';

const DataManagementPage = () => {
  const [activeTab, setActiveTab] = useState('sales');

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-display">Data Management</h1>
          <p className="text-muted-foreground mt-1">
            Add and manage sales, categories, and aisles
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Sales
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="aisles" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Aisles
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="sales" className="mt-0">
              <motion.div
                key="sales"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <SalesManager />
              </motion.div>
            </TabsContent>

            <TabsContent value="categories" className="mt-0">
              <motion.div
                key="categories"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <CategoriesManager />
              </motion.div>
            </TabsContent>

            <TabsContent value="aisles" className="mt-0">
              <motion.div
                key="aisles"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <AislesManager />
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default DataManagementPage;
