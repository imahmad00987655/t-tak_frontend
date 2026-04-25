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
import { Eye, Edit, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDelivery, fetchDeliveries, fetchDeliveryLookups, updateDelivery } from '@/lib/deliveriesApi';
import type { Delivery } from '@/types';

export default function DeliveriesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

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
  const watchedCustomerId = useWatch({ control, name: 'customerId' });
  const watchedAdvanceAmount = useWatch({ control, name: 'advanceAmount' });

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
  const selectedCustomer = useMemo(
    () => (lookups?.customers ?? []).find((c) => c.id === watchedCustomerId),
    [lookups, watchedCustomerId]
  );
  const selectedCustomerWallet = Number((selectedCustomer as any)?.walletBalance || 0);
  const advanceUsed = Math.min(computedTotal, Number(watchedAdvanceAmount || 0));
  const payableAfterAdvance = Math.max(0, computedTotal - advanceUsed);
  const computedWalletDeduction = Math.min(payableAfterAdvance, selectedCustomerWallet);
  const computedAmountDue = Math.max(0, payableAfterAdvance - computedWalletDeduction);

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
  const editMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status: string; notes?: string; deliveryDate?: string; workerId?: string } }) =>
      updateDelivery(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Delivery updated');
      setEditOpen(false);
    },
    onError: (e: Error) => toast.error(e.message || 'Could not update delivery'),
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
      status: 'pending',
      paymentStatus: computedAmountDue <= 0 ? 'paid' : computedWalletDeduction > 0 ? 'partial' : 'unpaid',
      walletDeduction: computedWalletDeduction,
      deliveryDate: values.deliveryDate,
      deliveryTime: values.deliveryTime || undefined,
      periodStartDate: values.periodStartDate || undefined,
      periodEndDate: values.periodEndDate || undefined,
      advanceAmount: Number(values.advanceAmount || 0),
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
        <DataTable
          data={deliveries}
          columns={columns}
          searchKeys={['customerName', 'id', 'area', 'workerName']}
          actions={(d: Delivery) => (
            <div className="flex items-center gap-1">
              <button
                className="p-1.5 rounded hover:bg-muted"
                title="View"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDelivery(d);
                  setViewOpen(true);
                }}
              >
                <Eye className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                className="p-1.5 rounded hover:bg-muted"
                title="Edit"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDelivery(d);
                  setEditOpen(true);
                }}
              >
                <Edit className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          )}
        />
      )}
      {!deliveriesLoading && (
        <div className="mt-3 text-xs text-muted-foreground">
          Tip: New deliveries are created as <b>Pending</b>. Field worker completion marks them delivered.
        </div>
      )}
      {!deliveriesLoading && (
        <div className="hidden">
          {/* preserves type usage for actions callback */}
        </div>
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
              {!!selectedCustomer && (
                <p className="text-xs text-muted-foreground">
                  Wallet balance: Rs {selectedCustomerWallet.toLocaleString()}
                </p>
              )}
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
                            {(lookups?.products ?? []).filter((p) => p.status === 'active').map(p => (
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
                <Input value="Pending (auto)" disabled />
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
                <Input
                  value={computedAmountDue <= 0 ? 'Paid (auto)' : computedWalletDeduction > 0 ? 'Partial (auto)' : 'Unpaid (auto)'}
                  disabled
                />
              </div>
              <div className="space-y-1.5">
                <Label>Wallet Deduction</Label>
                <Input value={`Rs ${computedWalletDeduction.toLocaleString()}`} disabled />
              </div>
            </div>
            <div className="rounded-md border border-border p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Items Total</span><span>Rs {computedTotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Advance Used</span><span>- Rs {advanceUsed.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Payable After Advance</span><span>Rs {payableAfterAdvance.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount Due</span><span className={computedAmountDue > 0 ? 'text-destructive' : 'text-accent'}>Rs {computedAmountDue.toLocaleString()}</span></div>
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
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Delivery Details</DialogTitle>
            <DialogDescription>{selectedDelivery?.id}</DialogDescription>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Customer:</span> {selectedDelivery.customerName}</div>
                <div><span className="text-muted-foreground">Worker:</span> {selectedDelivery.workerName}</div>
                <div><span className="text-muted-foreground">Date:</span> {selectedDelivery.deliveryDate}</div>
                <div><span className="text-muted-foreground">Status:</span> {selectedDelivery.status}</div>
              </div>
              <div className="rounded-md border border-border p-2">
                {selectedDelivery.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1">
                    <span>{item.quantity}x {item.productName}</span>
                    <span>Rs {item.total}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Edit Delivery</DialogTitle>
            <DialogDescription>Update status/assignment/date.</DialogDescription>
          </DialogHeader>
          {selectedDelivery && (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                editMutation.mutate({
                  id: (selectedDelivery as any).dbId || selectedDelivery.id,
                  payload: {
                    status: String(formData.get('status') || selectedDelivery.status),
                    deliveryDate: String(formData.get('deliveryDate') || selectedDelivery.deliveryDate),
                    workerId: String(formData.get('workerId') || selectedDelivery.workerId),
                    notes: String(formData.get('notes') || selectedDelivery.notes || ''),
                  },
                });
              }}
            >
              <div className="space-y-1">
                <Label>Status</Label>
                <select name="status" defaultValue={selectedDelivery.status} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Delivery Date</Label>
                <Input name="deliveryDate" type="date" defaultValue={selectedDelivery.deliveryDate} />
              </div>
              <div className="space-y-1">
                <Label>Worker</Label>
                <select name="workerId" defaultValue={selectedDelivery.workerId} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {(lookups?.workers ?? []).map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Notes</Label>
                <Textarea name="notes" defaultValue={selectedDelivery.notes || ''} rows={2} className="resize-none" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={editMutation.isPending}>{editMutation.isPending ? 'Saving...' : 'Save'}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
