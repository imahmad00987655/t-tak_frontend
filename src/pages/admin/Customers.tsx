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
import { Plus, QrCode, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createCustomer, fetchCustomers, type CustomerDto } from '@/lib/customersApi';
import CustomerQrCardDialog from '@/components/customers/CustomerQrCardDialog';
import { fetchCustomerFormLookups } from '@/lib/routesApi';

const addCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  altPhone: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  area: z.string().min(1, 'Area is required'),
  zone: z.string().optional(),
  route: z.string().optional(),
  customerType: z.enum(['residential', 'commercial', 'industrial']),
  walletBalance: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
  assignedWorker: z.string().optional(),
  loginPhone: z.string().optional(),
  loginEmail: z.string().optional(),
  loginPassword: z.string().optional(),
});

type AddCustomerValues = z.infer<typeof addCustomerSchema>;

export default function CustomersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [qrCustomer, setQrCustomer] = useState<CustomerDto | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  const { data: customers = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });
  const { data: customerLookups } = useQuery({
    queryKey: ['customer-form-lookups'],
    queryFn: fetchCustomerFormLookups,
  });

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer added successfully');
      setAddOpen(false);
      reset();
    },
    onError: (e: Error) => {
      toast.error(e.message || 'Could not create customer');
    },
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AddCustomerValues>({
    resolver: zodResolver(addCustomerSchema),
    defaultValues: {
      name: '',
      phone: '',
      altPhone: '',
      address: '',
      area: '',
      zone: '',
      route: '',
      customerType: 'residential',
      walletBalance: 0,
      notes: '',
      assignedWorker: '',
      loginPhone: '',
      loginEmail: '',
      loginPassword: '',
    },
  });

  const onSubmit = (values: AddCustomerValues) => {
    createMutation.mutate({
      name: values.name,
      phone: values.phone,
      altPhone: values.altPhone || undefined,
      address: values.address,
      area: values.area,
      zone: values.zone || undefined,
      route: values.route || undefined,
      customerType: values.customerType,
      walletBalance: values.walletBalance ?? 0,
      notes: values.notes || undefined,
      assignedWorker: values.assignedWorker || undefined,
      loginPhone: values.loginPhone || undefined,
      loginEmail: values.loginEmail || undefined,
      loginPassword: values.loginPassword || undefined,
    });
  };

  const openAdd = () => {
    reset();
    setAddOpen(true);
  };

  const columns = [
    {
      key: 'customerId',
      label: 'ID',
      sortable: true,
      render: (c: CustomerDto) => <span className="font-mono text-xs">{c.customerId}</span>,
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (c: CustomerDto) => <span className="font-medium">{c.name}</span>,
    },
    { key: 'phone', label: 'Phone' },
    { key: 'area', label: 'Area', sortable: true },
    { key: 'route', label: 'Route' },
    {
      key: 'customerType',
      label: 'Type',
      render: (c: CustomerDto) => <span className="capitalize text-xs">{c.customerType}</span>,
    },
    {
      key: 'walletBalance',
      label: 'Balance',
      sortable: true,
      render: (c: CustomerDto) => (
        <span className={`font-medium ${c.walletBalance > 0 ? 'text-accent' : 'text-muted-foreground'}`}>
          Rs {c.walletBalance.toLocaleString()}
        </span>
      ),
    },
    { key: 'status', label: 'Status', render: (c: CustomerDto) => <StatusBadge status={c.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage customer accounts, QR codes, and billing"
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm h-9 px-4">
              <Plus className="w-4 h-4 mr-1.5" /> Add Customer
            </Button>
          </div>
        }
      />

      {isError && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
          <p className="font-medium text-destructive">Could not load customers</p>
          <p className="text-muted-foreground mt-1">
            {error instanceof Error ? error.message : 'Is the API running? Run the Node server and import the database schema.'}
          </p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      <div className="rounded-md border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground text-sm">Loading customers…</div>
        ) : (
          <DataTable
            data={customers}
            columns={columns}
            searchKeys={['name', 'customerId', 'phone', 'area', 'route']}
            onRowClick={(c) => navigate(`/admin/customers/${c.id}`)}
            actions={(c: CustomerDto) => (
              <button
                type="button"
                className="p-1.5 rounded hover:bg-muted"
                title="QR card"
                onClick={(e) => {
                  e.stopPropagation();
                  setQrCustomer(c);
                  setQrOpen(true);
                }}
              >
                <QrCode className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          />
        )}
      </div>

      <CustomerQrCardDialog customer={qrCustomer} open={qrOpen} onOpenChange={setQrOpen} />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              A unique customer code and QR token are created on the server when you save.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" placeholder="e.g. Ahmad Hassan" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" placeholder="03XX-XXXXXXX" {...register('phone')} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="altPhone">Alternate Phone</Label>
                <Input id="altPhone" placeholder="Optional" {...register('altPhone')} />
              </div>
              <div className="space-y-1.5">
                <Label>Customer Type *</Label>
                <Controller
                  name="customerType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="industrial">Industrial</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Full Address *</Label>
              <Textarea
                id="address"
                placeholder="House/Flat, Street, Block..."
                className="resize-none"
                rows={2}
                {...register('address')}
              />
              {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Area *</Label>
                <Controller
                  name="area"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select area" />
                      </SelectTrigger>
                      <SelectContent>
                        {(customerLookups?.areas ?? []).map((a) => (
                          <SelectItem key={a} value={a}>
                            {a}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.area && <p className="text-xs text-destructive">{errors.area.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Zone</Label>
                <Controller
                  name="zone"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {(customerLookups?.zones ?? []).map((z) => (
                          <SelectItem key={z} value={z}>
                            {z}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Route</Label>
                <Controller
                  name="route"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select route" />
                      </SelectTrigger>
                      <SelectContent>
                        {(customerLookups?.routes ?? []).map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="balance">Initial Wallet Balance</Label>
                <Input id="balance" type="number" placeholder="0" min={0} step="0.01" {...register('walletBalance')} />
              </div>
              <div className="space-y-1.5">
                <Label>Assigned Worker</Label>
                <Controller
                  name="assignedWorker"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select worker" />
                      </SelectTrigger>
                      <SelectContent>
                        {(customerLookups?.workers ?? []).map((w) => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Any special instructions..." className="resize-none" rows={2} {...register('notes')} />
            </div>
            <div className="border border-border rounded-md p-3 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer Login (optional)</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Login Phone</Label>
                  <Input placeholder="03XX-XXXXXXX" {...register('loginPhone')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Login Email</Label>
                  <Input type="email" placeholder="Optional" {...register('loginEmail')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <Input type="password" placeholder="Set password" {...register('loginPassword')} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving…' : 'Add Customer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
