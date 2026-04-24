import { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createReturnDamage, fetchFinanceLookups, fetchReturnsDamages, type ReturnDamageDto } from '@/lib/financeApi';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
  entryType: z.enum(['return', 'damage']),
  customerId: z.string().min(1),
  walkInName: z.string().optional(),
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().min(0),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ReturnsDamagesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data: rows = [] } = useQuery({
    queryKey: ['returns-damages', fromDate, toDate],
    queryFn: () => fetchReturnsDamages({ from: fromDate || undefined, to: toDate || undefined }),
  });
  const { data: lookups } = useQuery({
    queryKey: ['finance-lookups'],
    queryFn: fetchFinanceLookups,
  });

  const { register, control, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      entryType: 'return',
      customerId: 'walk-in',
      walkInName: '',
      productId: '',
      quantity: 1,
      unitPrice: 0,
      reason: '',
      notes: '',
    },
  });
  const customerId = watch('customerId');

  const mutation = useMutation({
    mutationFn: createReturnDamage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns-damages'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Return/Damage recorded');
      setOpen(false);
      reset();
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to record entry'),
  });

  const columns = [
    { key: 'entryType', label: 'Type', render: (r: ReturnDamageDto) => <span className="capitalize">{r.entryType}</span> },
    { key: 'customerName', label: 'Customer', sortable: true },
    { key: 'productName', label: 'Product', sortable: true },
    { key: 'quantity', label: 'Qty' },
    { key: 'adjustmentAmount', label: 'Amount', render: (r: ReturnDamageDto) => `Rs ${r.adjustmentAmount.toLocaleString()}` },
    { key: 'reason', label: 'Reason' },
    { key: 'createdAt', label: 'Date', render: (r: ReturnDamageDto) => new Date(r.createdAt).toLocaleDateString() },
  ];

  const onSubmit = (values: FormValues) => {
    mutation.mutate({
      entryType: values.entryType,
      customerId: values.customerId,
      walkInName: values.customerId === 'walk-in' ? values.walkInName : undefined,
      productId: values.productId,
      quantity: values.quantity,
      unitPrice: values.unitPrice,
      reason: values.reason || undefined,
      notes: values.notes || undefined,
    });
  };

  return (
    <div>
      <PageHeader
        title="Returns & Damages"
        description="Track product returns and damaged stock with inventory/financial adjustments."
        actions={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-1.5" /> Add Entry</Button>}
      />
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>From</Label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>To</Label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
      </div>
      <DataTable data={rows} columns={columns} searchKeys={['customerName', 'productName', 'reason']} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Return / Damage</DialogTitle>
            <DialogDescription>Works for registered and walk-in customers.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Controller
              control={control}
              name="entryType"
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label>Entry Type</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="return">Return</SelectItem>
                      <SelectItem value="damage">Damage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
            <Controller
              control={control}
              name="customerId"
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label>Customer</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walk-in">Walk-in</SelectItem>
                      {(lookups?.customers ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
            {customerId === 'walk-in' && (
              <div className="space-y-1.5">
                <Label>Walk-in Name</Label>
                <Input {...register('walkInName')} />
              </div>
            )}
            <Controller
              control={control}
              name="productId"
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label>Product</Label>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>
                      {(lookups?.products ?? []).filter((p) => p.status === 'active').map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.productId && <p className="text-xs text-destructive">{errors.productId.message}</p>}
                </div>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input type="number" min="1" {...register('quantity', { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label>Unit Price</Label>
                <Input type="number" min="0" step="0.01" {...register('unitPrice', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Input {...register('reason')} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} className="resize-none" {...register('notes')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Record'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
