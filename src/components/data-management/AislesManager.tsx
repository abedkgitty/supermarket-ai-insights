import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, MapPin, Hash } from 'lucide-react';
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
import { useAisles } from '@/hooks/useAisles';
import { useCreateAisle, useUpdateAisle, useDeleteAisle, AisleInput } from '@/hooks/useAislesMutations';

export function AislesManager() {
  const { toast } = useToast();
  const { data: aisles, isLoading } = useAisles();
  const createAisle = useCreateAisle();
  const updateAisle = useUpdateAisle();
  const deleteAisle = useDeleteAisle();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAisle, setEditingAisle] = useState<{ id: string } & AisleInput | null>(null);
  const [formData, setFormData] = useState<AisleInput>({
    name: '',
    aisle_number: 1,
    position_x: 0,
    position_y: 0,
    width: 100,
    height: 200,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      aisle_number: (aisles?.length || 0) + 1,
      position_x: 0,
      position_y: 0,
      width: 100,
      height: 200,
    });
    setEditingAisle(null);
  };

  const openEditDialog = (aisle: any) => {
    setEditingAisle({
      id: aisle.id,
      name: aisle.name,
      aisle_number: aisle.aisle_number,
      position_x: aisle.position_x,
      position_y: aisle.position_y,
      width: aisle.width,
      height: aisle.height,
    });
    setFormData({
      name: aisle.name,
      aisle_number: aisle.aisle_number,
      position_x: aisle.position_x,
      position_y: aisle.position_y,
      width: aisle.width,
      height: aisle.height,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAisle) {
        await updateAisle.mutateAsync({ id: editingAisle.id, ...formData });
        toast({ title: 'Aisle updated', description: 'The aisle has been updated.' });
      } else {
        await createAisle.mutateAsync(formData);
        toast({ title: 'Aisle created', description: 'The aisle has been added.' });
      }
      
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save aisle. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? Products in this aisle will lose their aisle assignment.')) return;
    
    try {
      await deleteAisle.mutateAsync(id);
      toast({ title: 'Aisle deleted', description: 'The aisle has been removed.' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete aisle.',
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success text-white">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Store Aisles</h3>
            <p className="text-sm text-muted-foreground">{aisles?.length || 0} aisles</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => resetForm()}>
              <Plus className="h-4 w-4" />
              Add Aisle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingAisle ? 'Edit Aisle' : 'Add New Aisle'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Aisle Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g., Produce, Dairy"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aisle_number">Aisle Number</Label>
                  <Input
                    id="aisle_number"
                    type="number"
                    min="1"
                    value={formData.aisle_number}
                    onChange={(e) => setFormData(f => ({ ...f, aisle_number: parseInt(e.target.value) || 1 }))}
                    required
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <p className="text-sm font-medium mb-3">Store Map Position</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="position_x">X Position</Label>
                    <Input
                      id="position_x"
                      type="number"
                      value={formData.position_x}
                      onChange={(e) => setFormData(f => ({ ...f, position_x: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position_y">Y Position</Label>
                    <Input
                      id="position_y"
                      type="number"
                      value={formData.position_y}
                      onChange={(e) => setFormData(f => ({ ...f, position_y: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="width">Width</Label>
                    <Input
                      id="width"
                      type="number"
                      min="50"
                      value={formData.width}
                      onChange={(e) => setFormData(f => ({ ...f, width: parseInt(e.target.value) || 100 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Height</Label>
                    <Input
                      id="height"
                      type="number"
                      min="50"
                      value={formData.height}
                      onChange={(e) => setFormData(f => ({ ...f, height: parseInt(e.target.value) || 200 }))}
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={createAisle.isPending || updateAisle.isPending}
              >
                {(createAisle.isPending || updateAisle.isPending) 
                  ? 'Saving...' 
                  : editingAisle ? 'Update Aisle' : 'Add Aisle'}
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
              <TableHead>Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {aisles?.map((aisle, index) => (
                <motion.tr
                  key={aisle.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-b border-border/50 hover:bg-secondary/50"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="font-bold">{aisle.aisle_number}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{aisle.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    ({aisle.position_x}, {aisle.position_y})
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {aisle.width} × {aisle.height}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(aisle)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(aisle.id)}
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

        {(!aisles || aisles.length === 0) && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <MapPin className="h-12 w-12 mb-3 opacity-50" />
            <p>No aisles configured</p>
            <p className="text-sm">Click "Add Aisle" to set up your store layout</p>
          </div>
        )}
      </div>
    </div>
  );
}
