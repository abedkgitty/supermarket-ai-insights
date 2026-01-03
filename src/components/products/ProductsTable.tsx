import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, Product, ProductInput } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useAisles } from '@/hooks/useAisles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Package, Search, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function ProductsTable() {
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const { data: aisles } = useAisles();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductInput>({
    name: '',
    sku: '',
    category_id: null,
    aisle_id: null,
    shelf_position: 1,
    cost_price: 0,
    selling_price: 0,
    stock_quantity: 0,
    min_stock_level: 10,
    supplier: '',
  });

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      category_id: null,
      aisle_id: null,
      shelf_position: 1,
      cost_price: 0,
      selling_price: 0,
      stock_quantity: 0,
      min_stock_level: 10,
      supplier: '',
    });
    setEditingProduct(null);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category_id: product.category_id,
      aisle_id: product.aisle_id,
      shelf_position: product.shelf_position,
      cost_price: Number(product.cost_price),
      selling_price: Number(product.selling_price),
      stock_quantity: product.stock_quantity,
      min_stock_level: product.min_stock_level,
      supplier: product.supplier,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, ...formData });
        toast.success('Product updated successfully');
      } else {
        await createProduct.mutateAsync(formData);
        toast.success('Product created successfully');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to save product');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct.mutateAsync(id);
        toast.success('Product deleted successfully');
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6 h-96 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading products...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-white">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold font-display">Product Inventory</h3>
            <p className="text-sm text-muted-foreground">{products?.length} total products</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white gap-2">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData(f => ({ ...f, sku: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={formData.category_id || ''}
                      onValueChange={(value) => setFormData(f => ({ ...f, category_id: value || null }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Aisle</Label>
                    <Select
                      value={formData.aisle_id || ''}
                      onValueChange={(value) => setFormData(f => ({ ...f, aisle_id: value || null }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select aisle" />
                      </SelectTrigger>
                      <SelectContent>
                        {aisles?.map(aisle => (
                          <SelectItem key={aisle.id} value={aisle.id}>
                            {aisle.name} (Aisle {aisle.aisle_number})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost Price ($)</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cost_price}
                      onChange={(e) => setFormData(f => ({ ...f, cost_price: parseFloat(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="selling">Selling Price ($)</Label>
                    <Input
                      id="selling"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.selling_price}
                      onChange={(e) => setFormData(f => ({ ...f, selling_price: parseFloat(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Qty</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData(f => ({ ...f, stock_quantity: parseInt(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minStock">Min Stock Level</Label>
                    <Input
                      id="minStock"
                      type="number"
                      min="0"
                      value={formData.min_stock_level}
                      onChange={(e) => setFormData(f => ({ ...f, min_stock_level: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier || ''}
                      onChange={(e) => setFormData(f => ({ ...f, supplier: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button type="submit" className="gradient-primary text-white">
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Aisle</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {filteredProducts?.map((product, index) => {
                const isLowStock = product.stock_quantity <= product.min_stock_level;
                const margin = ((Number(product.selling_price) - Number(product.cost_price)) / Number(product.selling_price) * 100).toFixed(0);
                
                return (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: index * 0.02 }}
                    className="group hover:bg-secondary/30"
                  >
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">{product.sku}</TableCell>
                    <TableCell>
                      {product.categories && (
                        <span 
                          className="px-2 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: product.categories.color }}
                        >
                          {product.categories.name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.aisles ? `Aisle ${product.aisles.aisle_number}` : '-'}
                    </TableCell>
                    <TableCell className="text-right">${Number(product.cost_price).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium">${Number(product.selling_price).toFixed(2)}</span>
                      <span className="text-xs text-success ml-1">({margin}%)</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`inline-flex items-center gap-1 ${isLowStock ? 'text-warning' : ''}`}>
                        {isLowStock && <AlertTriangle className="h-3 w-3" />}
                        {product.stock_quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
