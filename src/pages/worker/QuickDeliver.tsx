import { useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Minus, Plus, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCustomer } from '@/lib/customersApi';
import { completeDeliveryRuntime, fetchDeliveryLookups, fetchWorkerAssignedDelivery } from '@/lib/deliveriesApi';

function resolveWorkerId(userId?: string) {
  if (!userId) return '';
  const m = userId.match(/(\d+)$/);
  return m ? m[1] : '';
}

export default function QuickDeliverPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const workerId = user?.employeeId || resolveWorkerId(user?.id);
  const { data: customer, isLoading: customerLoading, isError: customerError } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => fetchCustomer(customerId!),
    enabled: !!customerId,
  });
  const { data: lookups, isLoading: lookupsLoading } = useQuery({
    queryKey: ['delivery-lookups'],
    queryFn: fetchDeliveryLookups,
  });
  const deliveryId = searchParams.get('deliveryId') || '';
  const { data: assignedDelivery, isLoading: assignedLoading } = useQuery({
    queryKey: ['worker-assigned-delivery', customerId, workerId, deliveryId],
    queryFn: async () => {
      const data = await fetchWorkerAssignedDelivery(customerId!, workerId);
      if (!deliveryId) return data;
      return data && data.id === deliveryId ? data : null;
    },
    enabled: !!customerId && !!workerId,
  });
  const activeProducts = useMemo(
    () => (lookups?.products ?? []).filter((p) => p.status === 'active' && p.defaultPrice > 0),
    [lookups]
  );
  const [extraItems, setExtraItems] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [paymentReceived, setPaymentReceived] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'online' | 'card' | 'other'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  const completeMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof completeDeliveryRuntime>[1] }) =>
      completeDeliveryRuntime(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['worker-dashboard', workerId] }),
        queryClient.invalidateQueries({ queryKey: ['client-dashboard', customerId] }),
        queryClient.invalidateQueries({ queryKey: ['deliveries'] }),
      ]);
      toast({ title: 'Delivery completed', description: 'Assigned delivery, payment and stock are updated.' });
      navigate('/worker');
    },
    onError: (error) => {
      toast({
        title: 'Failed to complete delivery',
        description: error instanceof Error ? error.message : 'Unexpected API error',
        variant: 'destructive',
      });
    },
  });

  if (!customerId) return <div className="p-8 text-center text-muted-foreground">Invalid customer link</div>;
  if (customerLoading || lookupsLoading || assignedLoading) return <div className="p-8 text-center text-muted-foreground">Loading customer data...</div>;
  if (customerError || !customer) return <div className="p-8 text-center text-muted-foreground">Customer not found</div>;
  if (!assignedDelivery) return <div className="p-8 text-center text-muted-foreground">No assigned pending delivery found for this customer.</div>;

  const updateQty = (productId: string, delta: number) => {
    setExtraItems(prev => {
      const next = { ...prev };
      const val = (next[productId] || 0) + delta;
      if (val <= 0) delete next[productId];
      else next[productId] = val;
      return next;
    });
  };

  const assignedTotal = assignedDelivery.totalAmount;
  const extraTotal = Object.entries(extraItems).reduce((sum, [pid, qty]) => {
    const product = activeProducts.find(p => p.id === pid);
    return sum + (product?.defaultPrice || 0) * qty;
  }, 0);
  const total = assignedTotal + extraTotal;
  const dueBeforeCollection = Math.max(0, total - assignedDelivery.walletDeduction);
  const amountDue = Math.max(0, dueBeforeCollection - Number(paymentReceived || 0));

  const handleConfirm = () => {
    if (!workerId) {
      toast({ title: 'Worker account missing', description: 'Please login again.', variant: 'destructive' });
      return;
    }

    const runtimeExtraItems = Object.entries(extraItems)
      .map(([productId, quantity]) => {
        const product = activeProducts.find((p) => p.id === productId);
        if (!product || quantity <= 0) return null;
        return {
          productId,
          quantity,
          unitPrice: product.defaultPrice,
        };
      })
      .filter((item): item is { productId: string; quantity: number; unitPrice: number } => !!item);

    completeMutation.mutate({
      id: (assignedDelivery as any).dbId || assignedDelivery.id,
      payload: {
        extraItems: runtimeExtraItems,
        paymentReceivedAmount: Number(paymentReceived || 0),
        paymentMethod,
        paymentNotes: paymentNotes.trim() || undefined,
        notes: notes.trim() || undefined,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
        <span className="font-semibold text-sm">Quick Delivery</span>
      </header>

      <div className="p-4 space-y-4 flex-1">
        {/* Customer Info */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold">{customer.name}</p>
              <p className="text-xs text-muted-foreground">{customer.customerId} · {customer.area}</p>
              <p className="text-xs text-muted-foreground mt-1">{customer.address}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-accent">
                <Wallet className="w-4 h-4" />
                <span className="font-semibold">Rs {customer.walletBalance.toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Current balance</p>
            </div>
          </div>
        </div>

        {/* Products */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Assigned Items</h3>
          <div className="space-y-2 mb-4">
            {assignedDelivery.items.map((item) => (
              <div key={`${item.productId}-${item.productName}`} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} x Rs {item.unitPrice} = Rs {item.total}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <h3 className="text-sm font-semibold mb-2">Add Extra Items (Optional)</h3>
          <div className="space-y-2">
            {activeProducts.map(p => {
              const qty = extraItems[p.id] || 0;
              return (
                <div key={p.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Rs {p.defaultPrice} / {p.unit}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateQty(p.id, -1)} className="w-10 h-10 rounded-lg border border-border flex items-center justify-center active:bg-muted">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-semibold">{qty}</span>
                    <button onClick={() => updateQty(p.id, 1)} className="w-10 h-10 rounded-lg border border-border flex items-center justify-center active:bg-muted">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs text-muted-foreground">Delivery Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any notes..."
            className="w-full h-16 px-3 py-2 mt-1 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Summary */}
        {total > 0 && (
          <div className="bg-card border border-border rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Assigned Total</span><span>Rs {assignedTotal}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Extra Items</span><span>Rs {extraTotal}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-semibold">Rs {total}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Wallet Deduction</span><span className="text-accent">-Rs {assignedDelivery.walletDeduction}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Collected Now</span><span>-Rs {Number(paymentReceived || 0)}</span></div>
            {amountDue > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Amount Due</span><span className="text-destructive font-semibold">Rs {amountDue}</span></div>}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Payment Method (if collected now)</p>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="cash">Cash</option>
                  <option value="online">Online</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Payment Received Now</p>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentReceived}
                  onChange={(e) => setPaymentReceived(Number(e.target.value) || 0)}
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Payment Note (optional)</p>
              <input
                type="text"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="e.g. customer paid cash separately"
                className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Confirm */}
      <div className="p-4 border-t border-border bg-card">
        <Button
          onClick={handleConfirm}
          className="w-full h-14 bg-accent text-accent-foreground hover:bg-accent/90 text-base font-semibold"
          disabled={completeMutation.isPending}
        >
          <Check className="w-5 h-5 mr-2" /> Confirm Delivery · Rs {total}
        </Button>
      </div>
    </div>
  );
}
