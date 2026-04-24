import { useState } from 'react';
import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fetchFinanceLookups, fetchPayments, recordPayment, type PaymentDto } from '@/lib/financeApi';

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const { data: payments = [], isLoading, isError, error } = useQuery({
    queryKey: ['payments', fromDate, toDate],
    queryFn: () => fetchPayments({ from: fromDate || undefined, to: toDate || undefined }),
  });
  const { data: lookups } = useQuery({
    queryKey: ['finance-lookups'],
    queryFn: fetchFinanceLookups,
  });

  const schema = z.object({
    customerId: z.string().min(1, 'Customer is required'),
    amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
    method: z.enum(['cash', 'bank_transfer', 'online', 'card', 'other']),
    referenceId: z.string().optional(),
    notes: z.string().optional(),
  });
  type FormValues = z.infer<typeof schema>;

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: '',
      amount: 0,
      method: 'cash',
      referenceId: '',
      notes: '',
    },
  });

  const mutation = useMutation({
    mutationFn: recordPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Payment recorded successfully');
      setOpen(false);
      reset();
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to record payment'),
  });

  const columns = [
    { key: 'id', label: 'ID', render: (p: PaymentDto) => <span className="font-mono text-xs">{p.id}</span> },
    { key: 'customerName', label: 'Customer', sortable: true, render: (p: PaymentDto) => <span className="font-medium">{p.customerName}</span> },
    { key: 'amount', label: 'Amount', sortable: true, render: (p: PaymentDto) => <span className="font-medium text-accent">Rs {p.amount.toLocaleString()}</span> },
    { key: 'method', label: 'Method', render: (p: PaymentDto) => <span className="capitalize text-xs">{p.method.replace('_', ' ')}</span> },
    { key: 'referenceId', label: 'Reference', render: (p: PaymentDto) => p.referenceId || '—' },
    { key: 'createdAt', label: 'Date', sortable: true, render: (p: PaymentDto) => new Date(p.createdAt).toLocaleDateString() },
  ];
  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const onSubmit = (values: FormValues) => {
    mutation.mutate({
      customerId: values.customerId,
      amount: values.amount,
      method: values.method,
      referenceId: values.referenceId || undefined,
      notes: values.notes || undefined,
    });
  };

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Record and track all payment transactions"
        actions={<Button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm h-9 px-4"><Plus className="w-4 h-4 mr-1.5" /> Record Payment</Button>}
      />
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label>From</Label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>To</Label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Total Payments</Label>
          <div className="h-10 px-3 rounded-md border border-border flex items-center font-semibold text-accent">
            Rs {totalAmount.toLocaleString()}
          </div>
        </div>
      </div>
      {isError && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
          <p className="font-medium text-destructive">Could not load payments</p>
          <p className="text-muted-foreground mt-1">{error instanceof Error ? error.message : 'Unknown API error'}</p>
        </div>
      )}
      {isLoading ? (
        <div className="rounded-md border border-border bg-card p-10 text-center text-sm text-muted-foreground">Loading payments...</div>
      ) : (
        <DataTable data={payments} columns={columns} searchKeys={['customerName', 'referenceId']} />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Record a payment received from a customer.</DialogDescription>
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
                        <SelectItem key={c.id} value={c.id}>{c.name} ({c.customerId})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.customerId && <p className="text-xs text-destructive">{errors.customerId.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Amount (Rs) *</Label>
                <Input type="number" placeholder="0" min="1" step="0.01" {...register('amount', { valueAsNumber: true })} />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Method *</Label>
                <Controller
                  control={control}
                  name="method"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reference / Transaction ID</Label>
              <Input placeholder="e.g. TRX-12345" {...register('referenceId')} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea placeholder="Optional notes..." className="resize-none" rows={2} {...register('notes')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Record Payment'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
