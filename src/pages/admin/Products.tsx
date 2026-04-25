import { useState } from 'react';
import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProduct, fetchProducts } from '@/lib/productsApi';
import type { Product } from '@/types';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const { data: products = [], isLoading, isError, error } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const productSchema = z.object({
    name: z.string().min(1, 'Product name is required'),
    description: z.string().optional(),
    category: z.string().min(1, 'Category is required'),
    unit: z.string().min(1, 'Unit is required'),
    defaultPrice: z.coerce.number().min(0),
    stockQuantity: z.coerce.number().min(0).optional(),
    status: z.enum(['active', 'inactive']),
  });
  type ProductFormValues = z.infer<typeof productSchema>;

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'Water',
      unit: 'can',
      defaultPrice: 0,
      stockQuantity: 0,
      status: 'active',
    },
  });

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product added successfully');
      setOpen(false);
      reset();
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to add product'),
  });

  const columns = [
    { key: 'name', label: 'Product', sortable: true, render: (p: Product) => <div><span className="font-medium">{p.name}</span><p className="text-xs text-muted-foreground">{p.description}</p></div> },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'unit', label: 'Unit' },
    { key: 'defaultPrice', label: 'Default Price', sortable: true, render: (p: Product) => `Rs ${p.defaultPrice}` },
    { key: 'stockQuantity', label: 'Stock', sortable: true, render: (p: Product) => <span className={p.stockQuantity < 50 ? 'text-destructive font-medium' : ''}>{p.stockQuantity}</span> },
    { key: 'status', label: 'Status', render: (p: Product) => <StatusBadge status={p.status} /> },
  ];
  const categoryOptions = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  const filteredProducts = products.filter((p) => statusFilter === 'all' || p.status === statusFilter);

  const onSubmit = (values: ProductFormValues) => {
    createMutation.mutate({
      name: values.name,
      description: values.description || undefined,
      category: values.category,
      unit: values.unit,
      defaultPrice: values.defaultPrice,
      stockQuantity: values.stockQuantity ?? 0,
      status: values.status,
    });
  };

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage product catalog and pricing"
        actions={<Button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm h-9 px-4"><Plus className="w-4 h-4 mr-1.5" /> Add Product</Button>}
      />
      {isError && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
          <p className="font-medium text-destructive">Could not load products</p>
          <p className="text-muted-foreground mt-1">{error instanceof Error ? error.message : 'Unknown API error'}</p>
        </div>
      )}
      {isLoading ? (
        <div className="rounded-md border border-border bg-card p-10 text-center text-sm text-muted-foreground">Loading products...</div>
      ) : (
        <>
          <div className="mb-3 flex gap-2">
            <Button type="button" variant={statusFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('all')}>All</Button>
            <Button type="button" variant={statusFilter === 'active' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('active')}>Active</Button>
            <Button type="button" variant={statusFilter === 'inactive' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('inactive')}>Inactive</Button>
          </div>
          <DataTable data={filteredProducts} columns={columns} searchKeys={['name', 'category']} />
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>Add a new product to your catalog.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Product Name *</Label>
              <Input placeholder="e.g. 19L Water Can" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Short description..." className="resize-none" rows={2} {...register('description')} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Input list="product-categories" placeholder="e.g. Water, Packaging, Service" {...register('category')} />
                <datalist id="product-categories">
                  {categoryOptions.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1.5">
                <Label>Unit *</Label>
                <Controller
                  control={control}
                  name="unit"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="can">Can</SelectItem>
                        <SelectItem value="bottle">Bottle</SelectItem>
                        <SelectItem value="pack">Pack</SelectItem>
                        <SelectItem value="piece">Piece</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Default Price *</Label>
                <Input type="number" placeholder="0" min="0" step="0.01" {...register('defaultPrice', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Initial Stock</Label>
                <Input type="number" placeholder="0" min="0" {...register('stockQuantity', { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Saving...' : 'Add Product'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
