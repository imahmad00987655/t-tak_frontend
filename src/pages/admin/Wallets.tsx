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
import { fetchFinanceLookups, fetchWallets, rechargeWallet, type WalletCustomerDto } from '@/lib/financeApi';

export default function WalletsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const { data: wallets = [], isLoading, isError, error } = useQuery({
    queryKey: ['wallets'],
    queryFn: fetchWallets,
  });
  const { data: lookups } = useQuery({
    queryKey: ['finance-lookups'],
    queryFn: fetchFinanceLookups,
  });
  const filteredCustomers = (lookups?.customers ?? []).filter((c) => {
    const needle = customerSearch.trim().toLowerCase();
    if (!needle) return true;
    return (
      c.name.toLowerCase().includes(needle) ||
      c.customerId.toLowerCase().includes(needle)
    );
  });

  const schema = z.object({
    customerId: z.string().min(1, 'Customer is required'),
    amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
    method: z.enum(['cash', 'bank_transfer', 'online', 'card', 'other']),
    notes: z.string().optional(),
  });
  type FormValues = z.infer<typeof schema>;

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: '',
      amount: 0,
      method: 'cash',
      notes: '',
    },
  });

  const mutation = useMutation({
    mutationFn: rechargeWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['finance-lookups'] });
      toast.success('Wallet recharged successfully');
      setOpen(false);
      reset();
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to recharge wallet'),
  });

  const columns = [
    { key: 'customerId', label: 'ID', render: (c: WalletCustomerDto) => <span className="font-mono text-xs">{c.customerId}</span> },
    { key: 'name', label: 'Customer', sortable: true, render: (c: WalletCustomerDto) => <span className="font-medium">{c.name}</span> },
    { key: 'phone', label: 'Phone' },
    { key: 'area', label: 'Area' },
    { key: 'walletBalance', label: 'Balance', sortable: true, render: (c: WalletCustomerDto) => <span className={`font-semibold ${c.walletBalance > 0 ? 'text-accent' : 'text-muted-foreground'}`}>Rs {c.walletBalance.toLocaleString()}</span> },
  ];

  const onSubmit = (values: FormValues) => {
    mutation.mutate({
      customerId: values.customerId,
      amount: values.amount,
      method: values.method,
      notes: values.notes || undefined,
    });
  };

  return (
    <div>
      <PageHeader
        title="Customer Wallets"
        description="Manage prepaid balances and wallet recharges"
        actions={<Button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm h-9 px-4"><Plus className="w-4 h-4 mr-1.5" /> Recharge Wallet</Button>}
      />
      {isError && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
          <p className="font-medium text-destructive">Could not load wallets</p>
          <p className="text-muted-foreground mt-1">{error instanceof Error ? error.message : 'Unknown API error'}</p>
        </div>
      )}
      {isLoading ? (
        <div className="rounded-md border border-border bg-card p-10 text-center text-sm text-muted-foreground">Loading wallets...</div>
      ) : (
        <DataTable data={wallets} columns={columns} searchKeys={['name', 'customerId', 'phone']} />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Recharge Wallet</DialogTitle>
            <DialogDescription>Add balance to a customer's prepaid wallet.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Customer *</Label>
              <Input
                placeholder="Search customer by name or ID"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
              <Controller
                control={control}
                name="customerId"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent>
                      {filteredCustomers.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name} — Rs {c.walletBalance.toLocaleString()}</SelectItem>
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
                <Label>Payment Method</Label>
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
              <Label>Notes</Label>
              <Textarea placeholder="Optional reference..." className="resize-none" rows={2} {...register('notes')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Recharge Wallet'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
