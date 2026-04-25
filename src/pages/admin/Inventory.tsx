import { useState } from 'react';
import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createInventoryTransaction, fetchInventoryItems, fetchInventoryLookups } from '@/lib/inventoryApi';
import type { InventoryItem } from '@/types';

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const { data: items = [], isLoading, isError, error } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: fetchInventoryItems,
  });
  const { data: lookups } = useQuery({
    queryKey: ['inventory-lookups'],
    queryFn: fetchInventoryLookups,
  });

  const inventorySchema = z.object({
    itemId: z.string().min(1, 'Inventory item is required'),
    type: z.enum(['stock_in', 'stock_out', 'damage', 'loss']),
    quantity: z.coerce.number().int().positive('Quantity must be at least 1'),
    notes: z.string().optional(),
  });
  type InventoryFormValues = z.infer<typeof inventorySchema>;

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<InventoryFormValues>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      itemId: '',
      type: 'stock_in',
      quantity: 1,
      notes: '',
    },
  });

  const txMutation = useMutation({
    mutationFn: createInventoryTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-lookups'] });
      toast.success('Stock entry recorded');
      setOpen(false);
      reset({ itemId: '', type: 'stock_in', quantity: 1, notes: '' });
    },
    onError: (e: Error) => toast.error(e.message || 'Could not record stock entry'),
  });

  const columns = [
    { key: 'name', label: 'Item', sortable: true, render: (i: InventoryItem) => <span className="font-medium">{i.name}</span> },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'unit', label: 'Unit' },
    { key: 'currentStock', label: 'Current Stock', sortable: true, render: (i: InventoryItem) => (
      <div className="flex items-center gap-2">
        <span className={i.currentStock <= i.minStockLevel ? 'text-destructive font-medium' : ''}>{i.currentStock}</span>
        {i.currentStock <= i.minStockLevel && <AlertTriangle className="w-3.5 h-3.5 text-warning" />}
      </div>
    )},
    { key: 'minStockLevel', label: 'Min Level' },
    { key: 'unitCost', label: 'Unit Cost', render: (i: InventoryItem) => `Rs ${i.unitCost}` },
    { key: 'lastRestocked', label: 'Last Restocked', sortable: true },
  ];

  const onSubmit = (values: InventoryFormValues) => {
    txMutation.mutate({
      itemId: values.itemId,
      type: values.type,
      quantity: values.quantity,
      notes: values.notes || undefined,
    });
  };

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Track stock levels, movements, and alerts"
        actions={<Button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm h-9 px-4"><Plus className="w-4 h-4 mr-1.5" /> Stock Entry</Button>}
      />
      {isError && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
          <p className="font-medium text-destructive">Could not load inventory</p>
          <p className="text-muted-foreground mt-1">{error instanceof Error ? error.message : 'Unknown API error'}</p>
        </div>
      )}
      {isLoading ? (
        <div className="rounded-md border border-border bg-card p-10 text-center text-sm text-muted-foreground">Loading inventory...</div>
      ) : (
        <DataTable
          data={items}
          columns={columns}
          searchKeys={['name', 'category']}
          actions={(i: InventoryItem) => (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSelectedItem(i)}
            >
              View
            </Button>
          )}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Record Stock Entry</DialogTitle>
            <DialogDescription>Add stock in, stock out, damage, or loss records.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Inventory Item *</Label>
              <Controller
                control={control}
                name="itemId"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                    <SelectContent>
                      {(lookups?.items ?? []).map(i => (
                        <SelectItem key={i.id} value={i.id}>{i.name} (Stock: {i.currentStock})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.itemId && <p className="text-xs text-destructive">{errors.itemId.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stock_in">Stock In</SelectItem>
                        <SelectItem value="stock_out">Stock Out</SelectItem>
                        <SelectItem value="damage">Damage</SelectItem>
                        <SelectItem value="loss">Loss</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Quantity *</Label>
                <Input type="number" placeholder="0" min="1" {...register('quantity', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea placeholder="Reason or details..." className="resize-none" rows={2} {...register('notes')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={txMutation.isPending}>{txMutation.isPending ? 'Saving...' : 'Record Entry'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Inventory Item</DialogTitle>
            <DialogDescription>{selectedItem?.name}</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Category:</span> {selectedItem.category}</div>
              <div><span className="text-muted-foreground">Unit:</span> {selectedItem.unit}</div>
              <div><span className="text-muted-foreground">Current Stock:</span> {selectedItem.currentStock}</div>
              <div><span className="text-muted-foreground">Min Level:</span> {selectedItem.minStockLevel}</div>
              <div><span className="text-muted-foreground">Unit Cost:</span> Rs {selectedItem.unitCost}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
