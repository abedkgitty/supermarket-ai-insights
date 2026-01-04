import { motion } from 'framer-motion';
import { useAisles } from '@/hooks/useAisles';
import { useProducts } from '@/hooks/useProducts';
import { useState } from 'react';
import { MapPin, Package, Store } from 'lucide-react';

const aisleColors: Record<string, string> = {
  'Dairy & Refrigerated': 'hsl(217, 91%, 50%)',
  'Bakery & Bread': 'hsl(38, 92%, 50%)',
  'Grains & Rice': 'hsl(45, 80%, 45%)',
  'Oils & Cooking': 'hsl(25, 85%, 55%)',
  'Spices & Seasonings': 'hsl(15, 75%, 50%)',
  'Meat & Proteins': 'hsl(0, 84%, 60%)',
  'Breakfast Foods': 'hsl(48, 90%, 50%)',
  'Spreads & Sweets': 'hsl(330, 80%, 55%)',
  'Snacks': 'hsl(280, 70%, 55%)',
  'Beverages': 'hsl(271, 81%, 56%)',
  'Condiments': 'hsl(160, 60%, 45%)',
  'Canned Goods': 'hsl(200, 50%, 50%)',
  'Frozen Foods': 'hsl(190, 80%, 45%)',
  'Cleaning Supplies': 'hsl(220, 40%, 50%)',
  'Personal Care': 'hsl(300, 50%, 55%)',
};

export function StoreMap() {
  const { data: aisles, isLoading: aislesLoading } = useAisles();
  const { data: products } = useProducts();
  const [selectedAisle, setSelectedAisle] = useState<string | null>(null);

  if (aislesLoading) {
    return (
      <div className="glass-card p-6 h-[600px] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading store map...</div>
      </div>
    );
  }

  const getProductsInAisle = (aisleId: string) => {
    return products?.filter(p => p.aisle_id === aisleId) || [];
  };

  const selectedAisleData = aisles?.find(a => a.id === selectedAisle);
  const productsInSelectedAisle = selectedAisle ? getProductsInAisle(selectedAisle) : [];

  // Calculate SVG viewBox based on actual aisle positions
  const maxX = Math.max(...(aisles?.map(a => a.position_x + a.width) || [800])) + 50;
  const maxY = Math.max(...(aisles?.map(a => a.position_y + a.height) || [800])) + 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-white">
          <Store className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold font-display">Store Layout</h3>
          <p className="text-sm text-muted-foreground">
            Click an aisle to view products • {aisles?.length || 0} aisles • {products?.length || 0} products
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Store Map */}
        <div className="relative bg-gradient-to-br from-secondary/40 to-secondary/20 rounded-xl p-4 min-h-[600px] border border-border/50">
          {/* Store border */}
          <div className="absolute inset-4 border-2 border-dashed border-border/60 rounded-lg pointer-events-none" />
          
          {/* Entrance label */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-t-lg tracking-wider shadow-lg">
            ENTRANCE
          </div>

          {/* Aisles Grid */}
          <svg viewBox={`0 0 ${maxX} ${maxY}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* Background grid pattern */}
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" strokeOpacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {aisles?.map((aisle, index) => {
              const color = aisleColors[aisle.name] || 'hsl(220, 30%, 50%)';
              const productCount = getProductsInAisle(aisle.id).length;
              const isSelected = selectedAisle === aisle.id;
              
              return (
                <motion.g
                  key={aisle.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * index, duration: 0.3 }}
                  onClick={() => setSelectedAisle(isSelected ? null : aisle.id)}
                  style={{ cursor: 'pointer' }}
                  className="group"
                >
                  {/* Shadow */}
                  <rect
                    x={aisle.position_x + 4}
                    y={aisle.position_y + 4}
                    width={aisle.width}
                    height={aisle.height}
                    rx={10}
                    fill="black"
                    fillOpacity={0.15}
                  />
                  
                  {/* Aisle rectangle */}
                  <rect
                    x={aisle.position_x}
                    y={aisle.position_y}
                    width={aisle.width}
                    height={aisle.height}
                    rx={10}
                    fill={color}
                    fillOpacity={isSelected ? 1 : 0.75}
                    stroke={isSelected ? 'white' : 'rgba(255,255,255,0.3)'}
                    strokeWidth={isSelected ? 4 : 1}
                    className="transition-all duration-300"
                  />
                  
                  {/* Shelves lines */}
                  {[1, 2, 3, 4].map(shelf => (
                    <line
                      key={shelf}
                      x1={aisle.position_x + 12}
                      y1={aisle.position_y + 50 + (shelf * (aisle.height - 60) / 5)}
                      x2={aisle.position_x + aisle.width - 12}
                      y2={aisle.position_y + 50 + (shelf * (aisle.height - 60) / 5)}
                      stroke="white"
                      strokeOpacity={0.25}
                      strokeWidth={1.5}
                      strokeDasharray="4,4"
                    />
                  ))}

                  {/* Aisle label background */}
                  <rect
                    x={aisle.position_x + 8}
                    y={aisle.position_y + 8}
                    width={aisle.width - 16}
                    height={38}
                    rx={6}
                    fill="rgba(0,0,0,0.25)"
                  />

                  {/* Aisle label */}
                  <text
                    x={aisle.position_x + aisle.width / 2}
                    y={aisle.position_y + 25}
                    textAnchor="middle"
                    fill="white"
                    fontSize={11}
                    fontWeight="700"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                  >
                    {aisle.name}
                  </text>
                  
                  {/* Aisle number */}
                  <text
                    x={aisle.position_x + aisle.width / 2}
                    y={aisle.position_y + 40}
                    textAnchor="middle"
                    fill="white"
                    fillOpacity={0.8}
                    fontSize={10}
                  >
                    Aisle {aisle.aisle_number}
                  </text>

                  {/* Product count badge */}
                  <circle
                    cx={aisle.position_x + aisle.width - 18}
                    cy={aisle.position_y + aisle.height - 18}
                    r={16}
                    fill="white"
                    className="drop-shadow-lg"
                  />
                  <text
                    x={aisle.position_x + aisle.width - 18}
                    y={aisle.position_y + aisle.height - 13}
                    textAnchor="middle"
                    fill={color}
                    fontSize={12}
                    fontWeight="800"
                  >
                    {productCount}
                  </text>
                </motion.g>
              );
            })}

            {/* Checkout counters */}
            {[1, 2, 3, 4].map(counter => (
              <g key={counter}>
                <rect
                  x={120 + counter * 150}
                  y={maxY - 55}
                  width={100}
                  height={30}
                  rx={6}
                  fill="hsl(var(--muted))"
                  stroke="hsl(var(--border))"
                  strokeWidth={1}
                />
                <text 
                  x={170 + counter * 150} 
                  y={maxY - 35} 
                  textAnchor="middle" 
                  fill="hsl(var(--muted-foreground))" 
                  fontSize={10}
                  fontWeight="500"
                >
                  Register {counter}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Selected Aisle Info */}
        <div className="space-y-4">
          {selectedAisleData ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div 
                className="p-5 rounded-xl text-white shadow-lg"
                style={{ backgroundColor: aisleColors[selectedAisleData.name] || 'hsl(220, 30%, 50%)' }}
              >
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5" />
                  <div>
                    <h4 className="font-bold font-display text-lg">{selectedAisleData.name}</h4>
                    <p className="text-sm opacity-80">Aisle {selectedAisleData.aisle_number}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-sm font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Products ({productsInSelectedAisle.length})
                </h5>
                <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
                  {productsInSelectedAisle.length > 0 ? (
                    productsInSelectedAisle.map((product, idx) => (
                      <motion.div 
                        key={product.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="p-3 rounded-lg bg-secondary/60 border border-border/50 hover:bg-secondary transition-colors"
                      >
                        <p className="font-medium text-sm">{product.name}</p>
                        <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            Shelf {product.shelf_position || 'N/A'}
                          </span>
                          <span className="font-bold text-foreground">
                            ${Number(product.selling_price).toFixed(2)}
                          </span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No products in this aisle
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground text-sm gap-3 bg-secondary/30 rounded-xl border border-dashed border-border">
              <MapPin className="h-8 w-8 opacity-50" />
              <p>Click an aisle to view products</p>
            </div>
          )}

          {/* Legend */}
          <div className="p-4 rounded-xl bg-secondary/40 border border-border/50">
            <h5 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Aisle Legend
            </h5>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(aisleColors).slice(0, 10).map(([name, color]) => (
                <div key={name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-sm flex-shrink-0" 
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs truncate text-muted-foreground">{name}</span>
                </div>
              ))}
            </div>
            {Object.keys(aisleColors).length > 10 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                +{Object.keys(aisleColors).length - 10} more
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
