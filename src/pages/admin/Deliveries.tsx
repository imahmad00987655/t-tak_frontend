import { useMemo, useState } from 'react';
import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDelivery, fetchDeliveries, fetchDeliveryLookups } from '@/lib/deliveriesApi';
import type { Delivery } from '@/types';

export default function DeliveriesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: deliveries = [], isLoading: deliveriesLoading, isError, error } = useQuery({
    queryKey: ['deliveries'],
    queryFn: fetchDeliveries,
  });

  const { data: lookups } = useQuery({
    queryKey: ['delivery-lookups'],
    queryFn: fetchDeliveryLookups,
  });

  const deliverySchema = z.object({
    customerId: z.string().min(1, 'Customer is required'),
    workerId: z.string().min(1, 'Worker is required'),
    deliveryDate: z.string().min(1, 'Delivery date is required'),
    deliveryTime: z.string().optional(),
    periodStartDate: z.string().optional(),
    periodEndDate: z.string().optional(),
    advanceAmount: z.coerce.number().min(0).optional(),
    status: z.enum(['pending', 'assigned', 'in_progress', 'delivered', 'partially_delivered', 'failed', 'cancelled']),
    paymentStatus: z.enum(['paid', 'partial', 'unpaid']),
    walletDeduction: z.coerce.number().min(0).optional(),
    notes: z.string().optional(),
    items: z.array(z.object({
      productId: z.string().min(1, 'Product is required'),
      quantity: z.coerce.number().int().positive('Qty must be at least 1'),
      unitPrice: z.coerce.number().min(0).optional(),
    })).min(1, 'At least one item is required'),
  });

  type DeliveryFormValues = z.infer<typeof deliverySchema>;

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      customerId: '',
      workerId: '',
      deliveryDate: new Date().toISOString().slice(0, 10),
      deliveryTime: '',
      periodStartDate: '',
      periodEndDate: '',
      advanceAmount: 0,
      status: 'pending',
      paymentStatus: 'unpaid',
      walletDeduction: 0,
      notes: '',
      items: [{ productId: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = useWatch({ control, name: 'items' });

  const productMap = useMemo(() => {
    return new Map((lookups?.products ?? []).map((p) => [p.id, p]));
  }, [lookups]);

  const computedTotal = useMemo(() => {
    return (watchedItems ?? []).reduce((sum, item) => {
      const product = productMap.get(item?.productId || '');
      const fallbackPrice = product?.defaultPrice ?? 0;
      const unitPrice = typeof item?.unitPrice === 'number' ? item.unitPrice : fallbackPrice;
      const quantity = Number(item?.quantity || 0);
      return sum + unitPrice * quantity;
    }, 0);
  }, [watchedItems, productMap]);

  const createMutation = useMutation({
    mutationFn: createDelivery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Delivery created successfully');
      setOpen(false);
      reset({
        customerId: '',
        workerId: '',
        deliveryDate: new Date().toISOString().slice(0, 10),
        deliveryTime: '',
        periodStartDate: '',
        periodEndDate: '',
        advanceAmount: 0,
        status: 'pending',
        paymentStatus: 'unpaid',
        walletDeduction: 0,
        notes: '',
        items: [{ productId: '', quantity: 1, unitPrice: 0 }],
      });
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to create delivery'),
  });

  const columns = [
    { key: 'id', label: 'ID', render: (d: Delivery) => <span className="font-mono text-xs">{d.id}</span> },
    { key: 'customerName', label: 'Customer', sortable: true, render: (d: Delivery) => <span className="font-medium">{d.customerName}</span> },
    { key: 'area', label: 'Area', sortable: true },
    { key: 'workerName', label: 'Worker', sortable: true },
    { key: 'totalAmount', label: 'Amount', sortable: true, render: (d: Delivery) => `Rs ${d.totalAmount.toLocaleString()}` },
    { key: 'paymentStatus', label: 'Payment', render: (d: Delivery) => <StatusBadge status={d.paymentStatus} /> },
    { key: 'deliveryDate', label: 'Date', sortable: true },
    {
      key: 'periodStartDate',
      label: 'Plan Period',
      render: (d: Delivery) =>
        d.periodStartDate && d.periodEndDate
          ? `${d.periodStartDate} to ${d.periodEndDate}`
          : '—',
    },
    { key: 'status', label: 'Status', render: (d: Delivery) => <StatusBadge status={d.status} /> },
  ];

  const onSubmit = (values: DeliveryFormValues) => {
    createMutation.mutate({
      customerId: values.customerId,
      workerId: values.workerId,
      status: values.status,
      paymentStatus: values.paymentStatus,
      walletDeduction: values.walletDeduction ?? 0,
      deliveryDate: values.deliveryDate,
      deliveryTime: values.deliveryTime || undefined,
      periodStartDate: values.periodStartDate || undefined,
      periodEndDate: values.periodEndDate || undefined,
      advanceAmount: values.advanceAmount ?? 0,
      notes: values.notes || undefined,
      items: values.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice ?? undefined,
      })),
    });
  };

  return (
    <div>
      <PageHeader
        title="Deliveries"
        description="Track and manage all delivery operations"
        actions={<Button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm h-9 px-4"><Plus className="w-4 h-4 mr-1.5" /> New Delivery</Button>}
      />
      {isError && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
          <p className="font-medium text-destructive">Could not load deliveries</p>
          <p className="text-muted-foreground mt-1">{error instanceof Error ? error.message : 'Unknown API error'}</p>
        </div>
      )}
      {deliveriesLoading ? (
        <div className="rounded-md border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Loading deliveries...
        </div>
      ) : (
        <DataTable data={deliveries} columns={columns} searchKeys={['customerName', 'id', 'area', 'workerName']} />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Delivery</DialogTitle>
            <DialogDescription>Assign a delivery to a customer and worker.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Customer *</Label>
              <Controller
                control={control}
                name="customerId"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent>
                      {(lookups?.customers ?? []).map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name} — {c.area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.customerId && <p className="text-xs text-destructive">{errors.customerId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Assign Worker *</Label>
              <Controller
                control={control}
                name="workerId"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
                    <SelectContent>
                      {(lookups?.workers ?? []).map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name} — {w.assignedArea}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.workerId && <p className="text-xs text-destructive">{errors.workerId.message}</p>}
            </div>
            <div className="border border-border rounded-md p-4 space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Delivery Items</Label>
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5 space-y-1">
                    <Label className="text-xs">Product</Label>
                    <Controller
                      control={control}
                      name={`items.${index}.productId`}
                      render={({ field: itemField }) => (
                        <Select
                          value={itemField.value || undefined}
                          onValueChange={(value) => {
                            itemField.onChange(value);
                            const product = productMap.get(value);
                            if (product) setValue(`items.${index}.unitPrice`, product.defaultPrice);
                          }}
                        >
                          <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {(lookups?.products ?? []).map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name} — Rs {p.defaultPrice}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input type="number" min="1" className="h-9" {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">Price</Label>
                    <Input type="number" min="0" step="0.01" className="h-9" {...register(`items.${index}.unitPrice`, { valueAsNumber: true })} />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}
                >
                  + Add item
                </Button>
                <p className="text-sm font-medium">Estimated total: Rs {computedTotal.toLocaleString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Delivery Date *</Label>
                <Input type="date" {...register('deliveryDate')} />
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
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="partially_delivered">Partially Delivered</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Plan Start Date</Label>
                <Input type="date" {...register('periodStartDate')} />
              </div>
              <div className="space-y-1.5">
                <Label>Plan End Date</Label>
                <Input type="date" {...register('periodEndDate')} />
              </div>
              <div className="space-y-1.5">
                <Label>Advance Amount</Label>
                <Input type="number" min="0" step="0.01" placeholder="0" {...register('advanceAmount', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Payment Status</Label>
                <Controller
                  control={control}
                  name="paymentStatus"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Wallet Deduction</Label>
                <Input type="number" min="0" step="0.01" placeholder="0" {...register('walletDeduction', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Delivery Time</Label>
              <Input type="time" {...register('deliveryTime')} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea placeholder="Delivery instructions..." className="resize-none" rows={2} {...register('notes')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Delivery'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
