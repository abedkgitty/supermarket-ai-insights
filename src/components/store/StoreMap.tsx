import { motion } from 'framer-motion';
import { useAisles } from '@/hooks/useAisles';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useState } from 'react';
import { MapPin, Package } from 'lucide-react';

const aisleColors: Record<string, string> = {
  'Produce': 'hsl(142, 76%, 36%)',
  'Dairy': 'hsl(217, 91%, 50%)',
  'Bakery': 'hsl(38, 92%, 50%)',
  'Meat & Seafood': 'hsl(0, 84%, 60%)',
  'Frozen Foods': 'hsl(190, 80%, 45%)',
  'Beverages': 'hsl(271, 81%, 56%)',
  'Snacks': 'hsl(330, 80%, 60%)',
  'Household': 'hsl(220, 10%, 46%)',
};

export function StoreMap() {
  const { data: aisles, isLoading: aislesLoading } = useAisles();
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const [selectedAisle, setSelectedAisle] = useState<string | null>(null);

  if (aislesLoading) {
    return (
      <div className="glass-card p-6 h-[500px] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading store map...</div>
      </div>
    );
  }

  const getProductsInAisle = (aisleId: string) => {
    return products?.filter(p => p.aisle_id === aisleId) || [];
  };

  const selectedAisleData = aisles?.find(a => a.id === selectedAisle);
  const productsInSelectedAisle = selectedAisle ? getProductsInAisle(selectedAisle) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-white">
          <MapPin className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold font-display">Store Layout</h3>
          <p className="text-sm text-muted-foreground">Top-down aisle view</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Store Map */}
        <div className="flex-1 relative bg-secondary/30 rounded-xl p-4 min-h-[400px]">
          {/* Store border */}
          <div className="absolute inset-4 border-2 border-dashed border-border rounded-lg" />
          
          {/* Entrance */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 bg-foreground text-background text-xs font-semibold rounded-t-lg">
            ENTRANCE
          </div>

          {/* Aisles Grid */}
          <svg viewBox="0 0 700 500" className="w-full h-full">
            {aisles?.map((aisle, index) => {
              const color = aisleColors[aisle.name] || 'hsl(220, 10%, 46%)';
              const productCount = getProductsInAisle(aisle.id).length;
              const isSelected = selectedAisle === aisle.id;
              
              return (
                <motion.g
                  key={aisle.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  onClick={() => setSelectedAisle(isSelected ? null : aisle.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Aisle rectangle */}
                  <rect
                    x={aisle.position_x}
                    y={aisle.position_y}
                    width={aisle.width}
                    height={aisle.height}
                    rx={8}
                    fill={color}
                    fillOpacity={isSelected ? 0.9 : 0.6}
                    stroke={isSelected ? 'white' : 'transparent'}
                    strokeWidth={3}
                    className="transition-all duration-200 hover:fill-opacity-80"
                  />
                  
                  {/* Shelves lines */}
                  {[1, 2, 3, 4].map(shelf => (
                    <line
                      key={shelf}
                      x1={aisle.position_x + 10}
                      y1={aisle.position_y + (shelf * aisle.height / 5)}
                      x2={aisle.position_x + aisle.width - 10}
                      y2={aisle.position_y + (shelf * aisle.height / 5)}
                      stroke="white"
                      strokeOpacity={0.3}
                      strokeWidth={1}
                    />
                  ))}

                  {/* Aisle label */}
                  <text
                    x={aisle.position_x + aisle.width / 2}
                    y={aisle.position_y + 25}
                    textAnchor="middle"
                    fill="white"
                    fontSize={12}
                    fontWeight="600"
                  >
                    {aisle.name}
                  </text>
                  
                  {/* Aisle number */}
                  <text
                    x={aisle.position_x + aisle.width / 2}
                    y={aisle.position_y + 45}
                    textAnchor="middle"
                    fill="white"
                    fillOpacity={0.7}
                    fontSize={10}
                  >
                    Aisle {aisle.aisle_number}
                  </text>

                  {/* Product count badge */}
                  <circle
                    cx={aisle.position_x + aisle.width - 15}
                    cy={aisle.position_y + 15}
                    r={12}
                    fill="white"
                  />
                  <text
                    x={aisle.position_x + aisle.width - 15}
                    y={aisle.position_y + 19}
                    textAnchor="middle"
                    fill={color}
                    fontSize={10}
                    fontWeight="700"
                  >
                    {productCount}
                  </text>
                </motion.g>
              );
            })}

            {/* Checkout counters */}
            {[1, 2, 3].map(counter => (
              <rect
                key={counter}
                x={150 + counter * 120}
                y={440}
                width={80}
                height={25}
                rx={4}
                fill="hsl(var(--foreground))"
                fillOpacity={0.2}
              />
            ))}
            <text x={350} y={458} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={10}>
              Checkout
            </text>
          </svg>
        </div>

        {/* Selected Aisle Info */}
        <div className="w-72 space-y-4">
          {selectedAisleData ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div 
                className="p-4 rounded-xl text-white"
                style={{ backgroundColor: aisleColors[selectedAisleData.name] }}
              >
                <h4 className="font-semibold font-display">{selectedAisleData.name}</h4>
                <p className="text-sm opacity-80">Aisle {selectedAisleData.aisle_number}</p>
              </div>

              <div className="space-y-2">
                <h5 className="text-sm font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Products ({productsInSelectedAisle.length})
                </h5>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {productsInSelectedAisle.map(product => (
                    <div 
                      key={product.id}
                      className="p-3 rounded-lg bg-secondary/50 text-sm"
                    >
                      <p className="font-medium">{product.name}</p>
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>Shelf {product.shelf_position}</span>
                        <span className="font-semibold text-foreground">
                          ${Number(product.selling_price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Click an aisle to view products
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 p-4 rounded-xl bg-secondary/30">
            <h5 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Legend</h5>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(aisleColors).map(([name, color]) => (
                <div key={name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-sm" 
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs truncate">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
