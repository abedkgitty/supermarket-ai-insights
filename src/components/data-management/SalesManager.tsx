import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ShoppingCart, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useSales, useCreateSale, useDeleteSale } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import { format, parseISO } from 'date-fns';

export function SalesManager() {
  const { toast } = useToast();
  const { data: sales, isLoading } = useSales();
  const { data: products } = useProducts();
  const createSale = useCreateSale();
  const deleteSale = useDeleteSale();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: 1,
    sale_date: new Date().toISOString().split('T')[0],
  });

  const selectedProduct = products?.find(p => p.id === formData.product_id);
  const calculatedTotal = selectedProduct 
    ? Number(selectedProduct.selling_price) * formData.quantity 
    : 0;

  const resetForm = () => {
    setFormData({
      product_id: '',
      quantity: 1,
      sale_date: new Date().toISOString().split('T')[0],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createSale.mutateAsync({
        product_id: formData.product_id,
        quantity: formData.quantity,
        total_amount: calculatedTotal,
        sale_date: formData.sale_date,
      });
      
      toast({
        title: 'Sale recorded',
        description: 'The sale has been added successfully.',
      });
      
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record sale. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sale?')) return;
    
    try {
      await deleteSale.mutateAsync(id);
      toast({
        title: 'Sale deleted',
        description: 'The sale has been removed.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete sale.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-white">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Sales Transactions</h3>
            <p className="text-sm text-muted-foreground">{sales?.length || 0} records</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Record Sale
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Record New Sale</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <Select
                  value={formData.product_id}
                  onValueChange={(value) => setFormData(f => ({ ...f, product_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - ${Number(product.selling_price).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sale_date">Sale Date</Label>
                  <Input
                    id="sale_date"
                    type="date"
                    value={formData.sale_date}
                    onChange={(e) => setFormData(f => ({ ...f, sale_date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {selectedProduct && (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Amount</span>
                    <span className="text-2xl font-bold text-primary">
                      ${calculatedTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={!formData.product_id || createSale.isPending}>
                {createSale.isPending ? 'Recording...' : 'Record Sale'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {sales?.map((sale, index) => (
                <motion.tr
                  key={sale.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-b border-border/50 hover:bg-secondary/50"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {format(parseISO(sale.sale_date), 'MMM d, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {sale.products?.name || 'Unknown Product'}
                  </TableCell>
                  <TableCell className="text-right">{sale.quantity}</TableCell>
                  <TableCell className="text-right font-semibold">
                    <div className="flex items-center justify-end gap-1">
                      <DollarSign className="h-4 w-4 text-success" />
                      {Number(sale.total_amount).toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(sale.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>

        {(!sales || sales.length === 0) && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mb-3 opacity-50" />
            <p>No sales recorded yet</p>
            <p className="text-sm">Click "Record Sale" to add your first transaction</p>
          </div>
        )}
      </div>
    </div>
  );
}
