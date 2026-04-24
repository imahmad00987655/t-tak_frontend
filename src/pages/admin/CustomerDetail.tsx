import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Edit, QrCode, Wallet, Truck, Phone, MapPin, Calendar } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fetchCustomer, fetchWalletTransactions, updateCustomer, type CustomerDto } from '@/lib/customersApi';
import { fetchDeliveries } from '@/lib/deliveriesApi';
import { toast } from 'sonner';
import CustomerQrCardDialog from '@/components/customers/CustomerQrCardDialog';

const editSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  altPhone: z.string().optional(),
  address: z.string().min(1),
  area: z.string().min(1),
  zone: z.string().optional(),
  route: z.string().optional(),
  customerType: z.enum(['residential', 'commercial', 'industrial']),
  status: z.enum(['active', 'inactive']),
  notes: z.string().optional(),
  assignedWorker: z.string().optional(),
});

type EditValues = z.infer<typeof editSchema>;

const AREAS = ['Gulberg', 'DHA', 'Johar Town', 'Model Town', 'Wapda Town', 'Kot Lakhpat', 'Old City'] as const;
const ZONES = ['Central', 'North', 'South', 'East', 'West'] as const;
const ROUTES = ['Route A1', 'Route A2', 'Route B1', 'Route B2', 'Route C1', 'Route D1', 'Route E1'] as const;
const WORKERS = [
  { id: '1', name: 'Imran Khan' },
  { id: '2', name: 'Tariq Mehmood' },
  { id: '3', name: 'Naveed Akhtar' },
] as const;

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const { data: customer, isLoading, isError, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => fetchCustomer(id!),
    enabled: !!id,
  });

  const { data: walletTxns = [] } = useQuery({
    queryKey: ['wallet-txns', id],
    queryFn: () => fetchWalletTransactions(id!),
    enabled: !!id && !!customer,
  });
  const { data: deliveryRows = [] } = useQuery({
    queryKey: ['deliveries'],
    queryFn: fetchDeliveries,
  });

  const updateMut = useMutation({
    mutationFn: (body: Partial<EditValues>) => updateCustomer(id!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer updated');
      setEditOpen(false);
    },
    onError: (e: Error) => toast.error(e.message || 'Update failed'),
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: '',
      phone: '',
      altPhone: '',
      address: '',
      area: '',
      zone: '',
      route: '',
      customerType: 'residential',
      status: 'active',
      notes: '',
      assignedWorker: '',
    },
  });

  useEffect(() => {
    if (customer && editOpen) {
      reset({
        name: customer.name,
        phone: customer.phone,
        altPhone: customer.altPhone ?? '',
        address: customer.address,
        area: customer.area,
        zone: customer.zone ?? '',
        route: customer.route ?? '',
        customerType: customer.customerType,
        status: customer.status,
        notes: customer.notes ?? '',
        assignedWorker: customer.assignedWorker ?? '',
      });
    }
  }, [customer, editOpen, reset]);

  if (!id) {
    return <div className="p-8 text-center text-muted-foreground">Invalid link</div>;
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading customer…</div>;
  }

  if (isError || !customer) {
    return (
      <div className="p-8 text-center space-y-2">
        <p className="text-muted-foreground">{error instanceof Error ? error.message : 'Customer not found'}</p>
        <Button variant="outline" onClick={() => navigate('/admin/customers')}>
          Back to list
        </Button>
      </div>
    );
  }

  const deliveries = deliveryRows.filter((d) => d.customerId === id);

  const onEditSubmit = (values: EditValues) => {
    updateMut.mutate({
      name: values.name,
      phone: values.phone,
      altPhone: values.altPhone || undefined,
      address: values.address,
      area: values.area,
      zone: values.zone || undefined,
      route: values.route || undefined,
      customerType: values.customerType,
      status: values.status,
      notes: values.notes || undefined,
      assignedWorker: values.assignedWorker || undefined,
    });
  };

  return (
    <div>
      <PageHeader
        title={customer.name}
        description={`${customer.customerId} · ${customer.area}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/customers')} className="h-9 text-sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
            </Button>
            <Button
              variant="outline"
              className="h-9 text-sm"
              onClick={() => {
                setQrOpen(true);
              }}
            >
              <QrCode className="w-4 h-4 mr-1.5" /> QR Card
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-sm"
              onClick={() => setEditOpen(true)}
            >
              <Edit className="w-4 h-4 mr-1.5" /> Edit
            </Button>
          </div>
        }
      />

      <CustomerQrCardDialog
        customer={customer as CustomerDto}
        open={qrOpen}
        onOpenChange={setQrOpen}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit customer</DialogTitle>
            <DialogDescription>Update customer profile details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Phone *</Label>
              <Input {...register('phone')} />
            </div>
            <div className="space-y-1.5">
              <Label>Alternate phone</Label>
              <Input {...register('altPhone')} />
            </div>
            <div className="space-y-1.5">
              <Label>Address *</Label>
              <Textarea rows={2} className="resize-none" {...register('address')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Area *</Label>
                <Controller
                  name="area"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AREAS.map((a) => (
                          <SelectItem key={a} value={a}>
                            {a}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Zone</Label>
                <Controller
                  name="zone"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {ZONES.map((z) => (
                          <SelectItem key={z} value={z}>
                            {z}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Route</Label>
              <Controller
                name="route"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Route" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROUTES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
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
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Assigned worker</Label>
              <Controller
                name="assignedWorker"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Worker" />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKERS.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} className="resize-none" {...register('notes')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMut.isPending}>
                {updateMut.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-md p-5 space-y-4">
          <h3 className="text-sm font-semibold">Customer Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" /> {customer.phone}
            </div>
            {customer.altPhone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" /> {customer.altPhone}
              </div>
            )}
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" /> {customer.address}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" /> Joined {customer.joiningDate}
            </div>
          </div>
          <div className="pt-3 border-t border-border space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="capitalize">{customer.customerType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Route</span>
              <span>{customer.route}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Zone</span>
              <span>{customer.zone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={customer.status} />
            </div>
          </div>
          {customer.notes && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="text-sm mt-1">{customer.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Wallet Balance</h3>
              <Wallet className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-semibold text-accent">Rs {customer.walletBalance.toLocaleString()}</p>
          </div>
          <div className="bg-card border border-border rounded-md p-5">
            <h3 className="text-sm font-semibold mb-3">Recent Transactions</h3>
            {walletTxns.length === 0 ? (
              <p className="text-xs text-muted-foreground">No transactions yet</p>
            ) : (
              <div className="space-y-2">
                {walletTxns.map((t) => (
                  <div key={t.id} className="flex justify-between text-sm">
                    <div>
                      <p className="text-xs">{t.description}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`font-medium ${t.type === 'credit' ? 'text-accent' : 'text-destructive'}`}>
                      {t.type === 'credit' ? '+' : '-'}Rs {t.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-md p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Delivery History</h3>
            <Truck className="w-4 h-4 text-muted-foreground" />
          </div>
          {deliveries.length === 0 ? (
            <p className="text-xs text-muted-foreground">No deliveries recorded</p>
          ) : (
            <div className="space-y-3">
              {deliveries.map((d) => (
                <div key={d.id} className="border border-border rounded p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-xs">{d.id}</span>
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {d.deliveryDate} {d.deliveryTime && `· ${d.deliveryTime}`}
                  </p>
                  <div className="mt-2 space-y-1">
                    {d.items.map((item, i) => (
                      <div key={i} className="text-xs flex justify-between">
                        <span>
                          {item.quantity}x {item.productName}
                        </span>
                        <span>Rs {item.total}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-border flex justify-between text-sm font-medium">
                    <span>Total</span>
                    <span>Rs {d.totalAmount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
