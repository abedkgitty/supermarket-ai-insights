import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Tag, Palette } from 'lucide-react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/useCategories';
import { useCreateCategory, useUpdateCategory, useDeleteCategory, CategoryInput } from '@/hooks/useCategoriesMutations';

const PRESET_COLORS = [
  '#3B82F6', '#22C55E', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  '#F97316', '#6366F1', '#14B8A6', '#A855F7'
];

export function CategoriesManager() {
  const { toast } = useToast();
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string } & CategoryInput | null>(null);
  const [formData, setFormData] = useState<CategoryInput>({
    name: '',
    color: '#3B82F6',
    icon: null,
  });

  const resetForm = () => {
    setFormData({ name: '', color: '#3B82F6', icon: null });
    setEditingCategory(null);
  };

  const openEditDialog = (category: { id: string; name: string; color: string; icon?: string | null }) => {
    setEditingCategory({ id: category.id, name: category.name, color: category.color, icon: category.icon });
    setFormData({ name: category.name, color: category.color, icon: category.icon });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory.id, ...formData });
        toast({ title: 'Category updated', description: 'The category has been updated.' });
      } else {
        await createCategory.mutateAsync(formData);
        toast({ title: 'Category created', description: 'The category has been added.' });
      }
      
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save category. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? Products in this category will lose their category assignment.')) return;
    
    try {
      await deleteCategory.mutateAsync(id);
      toast({ title: 'Category deleted', description: 'The category has been removed.' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete category.',
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-accent text-white">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Product Categories</h3>
            <p className="text-sm text-muted-foreground">{categories?.length || 0} categories</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Electronics, Groceries"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl border-2 border-border"
                    style={{ backgroundColor: formData.color }}
                  />
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(f => ({ ...f, color }))}
                        className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${
                          formData.color === color ? 'ring-2 ring-primary ring-offset-2' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icon (optional)</Label>
                <Input
                  id="icon"
                  value={formData.icon || ''}
                  onChange={(e) => setFormData(f => ({ ...f, icon: e.target.value || null }))}
                  placeholder="e.g., shopping-cart, box"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={createCategory.isPending || updateCategory.isPending}
              >
                {(createCategory.isPending || updateCategory.isPending) 
                  ? 'Saving...' 
                  : editingCategory ? 'Update Category' : 'Add Category'}
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
              <TableHead>Color</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Icon</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {categories?.map((category, index) => (
                <motion.tr
                  key={category.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-b border-border/50 hover:bg-secondary/50"
                >
                  <TableCell>
                    <div 
                      className="w-8 h-8 rounded-lg"
                      style={{ backgroundColor: category.color }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {category.icon || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(category)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(category.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>

        {(!categories || categories.length === 0) && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Tag className="h-12 w-12 mb-3 opacity-50" />
            <p>No categories yet</p>
            <p className="text-sm">Click "Add Category" to create one</p>
          </div>
        )}
      </div>
    </div>
  );
}
